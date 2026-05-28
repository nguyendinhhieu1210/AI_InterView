export const authDebug = (
  label,
  data = null
) => {
  const time =
    new Date().toLocaleTimeString();

  console.log(
    `%c[AUTH ${time}] ${label}`,
    'color:#22c55e;font-weight:bold;',
    data || ''
  );
};