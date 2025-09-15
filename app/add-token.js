// app/add-token.js
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../theme/theme';
import { saveToken } from '../utils/storage';
import { generateTOTP, isValidBase32, parseMigrationData, detectCodeType, parseQRCode } from '../utils/totp';
import { SafeAreaView } from 'react-native-safe-area-context';
function normalizeSecretBase32(str) {
    return (str || '').replace(/\s+/g, '').toUpperCase();
}

function normalizeAlgorithm(algo) {
    const a = (algo || 'SHA-1').toUpperCase();
    if (a === 'SHA1') return 'SHA-1';
    if (a === 'SHA256') return 'SHA-256';
    if (a === 'SHA512') return 'SHA-512';
    return a;
}

export default function AddTokenScreen() {
    const [accountName, setAccountName] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [tokenType, setTokenType] = useState('time-based');
    const [algorithm, setAlgorithm] = useState('SHA-1');
    const [digits, setDigits] = useState(6);
    const [period, setPeriod] = useState(30);
    const [migrationData, setMigrationData] = useState('');
    const router = useRouter();

    const { colors } = useTheme();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const handleAddToken = async () => {
        const name = (accountName || '').trim();
        const secret = normalizeSecretBase32(secretKey);

        if (!name || !secret) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        if (!isValidBase32(secret)) {
            Alert.alert(
                'Formato de chave inválido',
                'A chave deve estar no formato Base32. Deseja continuar mesmo assim?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Continuar', onPress: actuallyAddToken }
                ]
            );
        } else {
            actuallyAddToken();
        }
    };

    const actuallyAddToken = async () => {
        try {
            const secret = normalizeSecretBase32(secretKey);
            const algo = normalizeAlgorithm(algorithm);

            const code = generateTOTP(secret, {
                algorithm: algo,
                digits: Number(digits) || 6,
                period: Number(period) || 30,
            });

            const newToken = {
                id: Date.now().toString(),
                accountName: (accountName || '').trim(),
                secretKey: secret,
                type: tokenType,
                algorithm: algo,
                digits: Number(digits) || 6,
                period: Number(period) || 30,
                code,
                timestamp: Date.now(),
            };

            await saveToken(newToken);
            Alert.alert('Sucesso', 'Conta adicionada com sucesso!');
            router.back();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao adicionar conta: ' + (error?.message || String(error)));
        }
    };

    const handlePasteMigrationData = async () => {
        try {
            const clipboardString = await Clipboard.getStringAsync();
            if (!clipboardString) {
                Alert.alert('Área de transferência vazia', 'Não há dados para colar.');
                return;
            }

            const codeType = detectCodeType(clipboardString);

            if (codeType === 'migration') {
                setMigrationData(clipboardString);
                Alert.alert(
                    'Dados de migração detectados',
                    'Deseja importar as contas do Google Authenticator?',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Importar', onPress: () => handleImportMigration(clipboardString) }
                    ]
                );
            } else if (codeType === 'otpauth') {
                try {
                    const parsed = parseQRCode(clipboardString);
                    setAccountName(parsed.accountName || '');
                    setSecretKey(normalizeSecretBase32(parsed.secret || ''));
                    setAlgorithm(normalizeAlgorithm(parsed.algorithm || 'SHA-1'));
                    setDigits(Number(parsed.digits || 6));
                    setPeriod(Number(parsed.period || 30));
                    Alert.alert('Sucesso', 'Dados do QR code importados com sucesso!');
                } catch (error) {
                    Alert.alert('Erro', 'Falha ao processar dados do QR code: ' + (error?.message || String(error)));
                }
            } else {
                setSecretKey(normalizeSecretBase32(clipboardString));
                Alert.alert('Dados colados', 'Chave secreta colada da área de transferência.');
            }
        } catch (error) {
            Alert.alert('Erro', 'Falha ao acessar a área de transferência.');
        }
    };

    const handleImportMigration = async (data) => {
        try {
            const accounts = parseMigrationData(data) || [];
            if (accounts.length === 0) {
                Alert.alert('Nenhuma conta encontrada', 'Os dados de migração não contêm contas válidas.');
                return;
            }

            for (const acc of accounts) {
                const secret = normalizeSecretBase32(acc.secretKey);
                const algo = normalizeAlgorithm(acc.algorithm || 'SHA-1');
                const d = Number(acc.digits || 6);
                const p = Number(acc.period || 30);

                const code = generateTOTP(secret, { algorithm: algo, digits: d, period: p });

                const newToken = {
                    id: Date.now().toString() + Math.random(),
                    accountName: acc.accountName || 'Conta',
                    secretKey: secret,
                    type: acc.type || 'time-based',
                    algorithm: algo,
                    digits: d,
                    period: p,
                    code,
                    timestamp: Date.now(),
                };
                await saveToken(newToken);
            }

            Alert.alert('Sucesso', `${accounts.length} conta(s) importada(s) com sucesso!`);
            router.back();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao importar dados de migração: ' + (error?.message || String(error)));
        }
    };

    const openMigrationGuide = () => {
        Alert.alert(
            'Como migrar do Google Authenticator',
            '1. No Google Authenticator, toque em "Exportar contas"\n' +
            '2. Selecione as contas que deseja exportar\n' +
            '3. Copie o código de migração\n' +
            '4. Volte para este app e cole o código no campo "Sua chave"',
            [{ text: 'Entendi' }]
        );
    };

    const renderOption = (value, label, state, setState) => (
        <TouchableOpacity
            style={[
                styles.optionButton(colors),
                state === value && styles.optionButtonSelected(colors),
            ]}
            onPress={() => setState(value)}
        >
            <Text
                style={[
                    styles.optionText(colors),
                    state === value && styles.optionTextSelected,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.header(colors)}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle(colors)}>Adicionar conta</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label(colors)}>Nome da conta</Text>
                    <TextInput
                        style={styles.input(colors)}
                        value={accountName}
                        onChangeText={setAccountName}
                        placeholder="Ex: Google, Facebook"
                        placeholderTextColor={colors.textSecondary}
                        autoCapitalize="words"
                    />

                    <View style={styles.secretContainer}>
                        <Text style={styles.label(colors)}>Sua chave</Text>
                        <TouchableOpacity onPress={handlePasteMigrationData} style={styles.pasteButton}>
                            <Ionicons name="clipboard-outline" size={16} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontSize: 14, marginLeft: 4 }}>Colar</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.input(colors)}
                        value={secretKey}
                        onChangeText={(v) => setSecretKey(normalizeSecretBase32(v))}
                        placeholder="Insira a chave secreta ou código de migração"
                        placeholderTextColor={colors.textSecondary}
                        autoCapitalize="characters"
                        multiline
                    />

                    <Text style={styles.label(colors)}>Tipo de chave</Text>
                    <View style={styles.optionContainer}>
                        {renderOption('time-based', 'Baseada no horário', tokenType, setTokenType)}
                        {renderOption('counter-based', 'Baseada na contagem', tokenType, setTokenType)}
                    </View>

                    <Text style={styles.label(colors)}>Algoritmo</Text>
                    <View style={styles.optionContainer}>
                        {renderOption('SHA-1', 'SHA-1', algorithm, setAlgorithm)}
                        {renderOption('SHA-256', 'SHA-256', algorithm, setAlgorithm)}
                        {renderOption('SHA-512', 'SHA-512', algorithm, setAlgorithm)}
                    </View>

                    <Text style={styles.label(colors)}>Dígitos</Text>
                    <View style={styles.optionContainer}>
                        {renderOption(6, 6, digits, setDigits)}
                        {renderOption(7, 7, digits, setDigits)}
                        {renderOption(8, 8, digits, setDigits)}
                    </View>

                    <Text style={styles.label(colors)}>Período (segundos)</Text>
                    <View style={styles.optionContainer}>
                        {renderOption(30, '30s', period, setPeriod)}
                        {renderOption(60, '60s', period, setPeriod)}
                        {renderOption(90, '90s', period, setPeriod)}
                    </View>

                    <TouchableOpacity style={styles.addButton(colors)} onPress={handleAddToken}>
                        <Text style={styles.addButtonText}>Adicionar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={openMigrationGuide} style={styles.migrationHelp}>
                        <Ionicons name="help-circle-outline" size={16} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontSize: 14, marginLeft: 4 }}>Como migrar do Google Authenticator</Text>
                    </TouchableOpacity>

                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 16, textAlign: 'center', lineHeight: 18 }}>
                        Dica: Para migrar do Google Authenticator, exporte suas contas e cole o código de migração no campo "Sua chave".
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = {
    header: (colors) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    }),
    backButton: { padding: 4 },
    headerTitle: (colors) => ({ fontSize: 18, fontWeight: '500', color: colors.text }),
    formContainer: { padding: 16 },
    label: (colors) => ({
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 8,
        marginTop: 16,
    }),
    input: (colors) => ({
        backgroundColor: colors.inputBackground,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: colors.text,
    }),
    secretContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pasteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#e8f0fe',
        borderRadius: 4,
    },
    optionContainer: { flexDirection: 'row', marginVertical: 8 },
    optionButton: (colors) => ({
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        marginHorizontal: 4,
    }),
    optionButtonSelected: (colors) => ({
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    }),
    optionText: (colors) => ({ color: colors.text, fontSize: 14 }),
    optionTextSelected: { color: '#fff', fontWeight: '500' },
    addButton: (colors) => ({
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    }),
    addButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
    migrationHelp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, padding: 8 },
};
