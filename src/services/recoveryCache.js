// Guarda os códigos recém-gerados só em memória, para mostrar uma vez. Nunca vai para o disco em texto.
let current = null;
export const setFreshRecoveryCodes = (codes) => { current = codes; };
export const takeFreshRecoveryCodes = () => current;
export const clearFreshRecoveryCodes = () => { current = null; };
