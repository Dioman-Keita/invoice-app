export default function isValidCmdtFormat(value: string, padding: number): boolean {
  const regex = new RegExp(`^\\d{${padding}}$`);
  return regex.test(value);
}
