/** Volta se houver histórico; senão vai para a home (ex.: link direto ou recarga na web). */
export function goBack(router) {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
