export function formatDate(value: string) {
  return new Date(
    /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`,
  ).toLocaleDateString("ko-KR");
}
