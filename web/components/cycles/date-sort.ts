// Sort cycles by start date, descending
export default function dateSort(a, b) {
  const dateA = new Date(a.start_date).getTime();
  const dateB = new Date(b.start_date).getTime();

  return dateB - dateA;
}