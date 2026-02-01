///////////////////////////////////////////////////
const COMPETITION_ID = "MelbourneSummer2026";
const DB_ROUND_ID = 909209;
const EVENT_ID = "333";
const N_COMPETITORS = 12;
///////////////////////////////////////////////////

const getBest = (resultRows: ResultRow[]) =>
  resultRows
    .flatMap((resultRow) => resultRow.slice(3).filter((x) => x > 0))
    .sort((a, b) => a - b)
    .at(0) || Infinity;

const getPoints = (resultRows: [ResultRow, ResultRow]) => {
  const points = [0, 0];
  for (let i = 3; i <= 9; i++) {
    const results = resultRows.map((resultRow) =>
      resultRow[i] < 0 ? Infinity : resultRow[i],
    );
    if (results[0] < results[1]) points[0]++;
    if (results[0] > results[1]) points[1]++;
  }
  return points as [number, number];
};

const getResultRows = (resultsSheet: GoogleAppsScript.Spreadsheet.Sheet) =>
  resultsSheet
    .getRange(2, 1, resultsSheet.getLastRow() - 1, 10)
    .getValues() as ResultRow[];

// Last two elements in resultRows are the current set
const getSetWinners = (resultRows: ResultRow[]) => {
  const setRows = resultRows.slice(-2);
  const points = getPoints(setRows as [ResultRow, ResultRow]);
  if (points[0] >= 3) return [setRows[0]];
  if (points[1] >= 3) return [setRows[1]];
  if (!setRows[0][9]) return setRows;
  if (points[0] > points[1]) return [setRows[0]];
  if (points[0] < points[1]) return [setRows[1]];
  const bestsInSet = setRows.map((setRow) => getBest([setRow]));
  if (bestsInSet[0] < bestsInSet[1]) return [setRows[0]];
  if (bestsInSet[0] > bestsInSet[1]) return [setRows[1]];
  const bestsInMatch = setRows.map((setRow) =>
    getBest(
      resultRows.filter(
        (resultRow) =>
          resultRow[0] === setRows[0][0] && resultRow[2] === setRow[2],
      ),
    ),
  );
  if (bestsInMatch[0] < bestsInMatch[1]) return [setRows[0]];
  if (bestsInMatch[0] > bestsInMatch[1]) return [setRows[1]];
  const bestsInRound = setRows.map((setRow) =>
    getBest(resultRows.filter((resultRow) => resultRow[2] === setRow[2])),
  );
  if (bestsInRound[0] < bestsInRound[1]) return [setRows[0]];
  if (bestsInRound[0] > bestsInRound[1]) return [setRows[1]];
  const seeds = setRows.map((resultRow) =>
    SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName("Competitors")!
      .getRange(2, 1, N_COMPETITORS)
      .getValues()
      .flat()
      .indexOf(resultRow[2]),
  );
  if (seeds[0] < seeds[1]) return [setRows[0]];
  return [setRows[1]];
};

const showError = (error: string) =>
  SpreadsheetApp.getActiveSpreadsheet().toast(error, "Error", 10);
