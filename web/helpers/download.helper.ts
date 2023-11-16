export const csvDownload = (data: Array<Array<string>> | { [key: string]: string }, name: string) => {
  let rows = [];

  if (Array.isArray(data)) {
    rows = [...data];
  } else {
    rows = [Object.keys(data), Object.values(data)];
  }

  let csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${name}.csv`);
  document.body.appendChild(link);
  link.click();
};
