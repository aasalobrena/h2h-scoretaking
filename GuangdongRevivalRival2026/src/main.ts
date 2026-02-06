const onOpen = () =>
  SpreadsheetApp.getUi()
    .createMenu("Dashboard")
    .addItem("Scrambles matcher", "scramblesMatcher")
    .addToUi();

const scramblesMatcher = () => {
  try {
    const parents = DriveApp.getFileById(
      SpreadsheetApp.getActive().getId(),
    ).getParents();
    if (!parents.hasNext()) return;
    const folder = parents.next();
    const files = folder.getFiles();
    let file: GoogleAppsScript.Drive.File;
    do {
      file = files.next();
    } while (
      files.hasNext() &&
      !file.getName().toLowerCase().endsWith(".json")
    );
    const wcif = getWcif();
    const values: (string | number)[][] = [
      [
        "round_id",
        "match_number",
        "match_set_number",
        "set_attempt_number",
        "registration_id",
        "final_position",
        "time_seconds",
        "scramble",
        "scramble_set_number",
        "scramble_number",
        "is_extra",
      ],
    ];
    EVENT_IDS.forEach((eventId) => {
      const scrambleSets = (
        JSON.parse(file.getBlob().getDataAsString()).wcif as Competition
      ).events
        .find((event) => event.id === eventId)!
        .rounds.flatMap((round) => round.scrambleSets!);
      const ss = SpreadsheetApp.getActive();
      const competitorRows = ss
        .getSheetByName(`${eventId} Competitors`)!
        .getRange(2, 1, N_COMPETITORS[eventId], 2)
        .getValues();
      const registrationIds = wcif.persons
        .filter((person) =>
          competitorRows
            .map((competitorRow) => competitorRow[0] as RegistrantId)
            .includes(person.registrantId),
        )
        .map((person) => [
          person.registrantId,
          person.registration!.wcaRegistrationId,
        ]) as [RegistrantId, number][];
      const resultsSheet = ss.getSheetByName(`${eventId} Results`)!;
      const resultRows = resultsSheet
        .getRange(2, 1, resultsSheet.getLastRow() - 1, 10)
        .getValues() as ResultRow[];
      resultRows.forEach((row, rowIndex) => {
        let ranking = 0;
        const lastMatchNumber = resultRows
          .filter((resultRow) => resultRow[2] === row[2])
          .at(-1)![0];
        switch (true) {
          case lastMatchNumber === N_COMPETITORS[eventId]:
            ranking =
              getSetWinners(eventId, resultRows)[0][2] === row[2] ? 1 : 2;
            break;
          case lastMatchNumber === N_COMPETITORS[eventId] - 1:
            ranking =
              getSetWinners(
                eventId,
                resultRows.filter(
                  (resultRow) => resultRow[0] < N_COMPETITORS[eventId],
                ),
              )[0][2] === row[2]
                ? 3
                : 4;
            break;
          ///////////////////////////////////////////////////
          case (eventId === "333" &&
            9 <= lastMatchNumber &&
            lastMatchNumber <= 12) ||
            (eventId === "444" && 1 <= lastMatchNumber && lastMatchNumber <= 4):
            const bests8 = competitorRows
              .filter((competitorRow) => {
                const lastMatchNumber = resultRows
                  .filter((resultRow) => resultRow[2] === competitorRow[0])
                  .at(-1)![0];
                return lastMatchNumber >= 5 && lastMatchNumber <= 8;
              })
              .map(
                (competitorRow) =>
                  [
                    competitorRow[0],
                    getBest(
                      resultRows.filter(
                        (resultRow) => resultRow[2] === competitorRow[0],
                      ),
                    ),
                  ] as [RegistrantId, number],
              );
            ranking =
              bests8.filter(
                (r) => r[1] < bests8.find((r) => r[0] === row[2])![1],
              ).length + 5;
            break;
          case eventId === "333" &&
            1 <= lastMatchNumber &&
            lastMatchNumber <= 8:
            const bests16 = competitorRows
              .filter(
                (competitorRow) =>
                  resultRows
                    .filter((resultRow) => resultRow[2] === competitorRow[0])
                    .at(-1)![0] <= 4,
              )
              .map(
                (competitorRow) =>
                  [
                    competitorRow[0],
                    getBest(
                      resultRows.filter(
                        (resultRow) => resultRow[2] === competitorRow[0],
                      ),
                    ),
                  ] as [RegistrantId, number],
              );
            ranking =
              bests16.filter(
                (r) => r[1] < bests16.find((r) => r[0] === row[2])![1],
              ).length + 9;
            break;
          ///////////////////////////////////////////////////
        }
        const scrambleSet = scrambleSets[Math.floor(rowIndex / 2)];
        const wcaRegistrationId = registrationIds.find(
          (registrationId) => registrationId[0] === (row[2] as RegistrantId),
        )![1];
        for (let i = 0; i < 7; i++) {
          if (row[i + 3]) {
            const isExtra = i >= 5;
            const scrambleIndex = isExtra ? i - 5 : i;
            values.push([
              DB_ROUND_IDS[eventId],
              row[0],
              row[1],
              i + 1,
              wcaRegistrationId,
              ranking,
              row[i + 3] < 0 ? row[i + 3] : row[i + 3] / 100,
              isExtra
                ? scrambleSet.extraScrambles[scrambleIndex]
                : scrambleSet.scrambles[scrambleIndex],
              scrambleSet.id,
              scrambleIndex + 1,
              Number(isExtra),
            ]);
          }
        }
      });
    });
    folder.createFile(
      `h2h_results_${COMPETITION_ID}.csv`,
      values.map((r) => r.join(",")).join("\n"),
    );
  } catch (err) {
    showError(err as string);
  }
};

const submitResults = (eventId: SupportedEventId) => {
  try {
    const ss = SpreadsheetApp.getActive();
    const scoretakingSheet = ss.getSheetByName(`${eventId} Scoretaking`)!;
    const resultsSheet = ss.getSheetByName(`${eventId} Results`)!;
    let resultRows = getResultRows(resultsSheet);
    const resultsRange = scoretakingSheet.getRange(8, 5, 2);
    const results = resultsRange.getValues() as [[number], [number]];
    if (results[0][0] && results[1][0]) {
      const matchDetailsRange = scoretakingSheet.getRange(2, 3, 4);
      const matchDetails = matchDetailsRange.getValues().flat() as [
        number,
        string,
        string,
        string,
      ];
      const setsCounts = matchDetails[2].split(" - ").map((s) => Number(s)) as [
        number,
        number,
      ];
      const currentSet = setsCounts.reduce((a, b) => a + b, 0) + 1;
      const registrantIdsRange = scoretakingSheet.getRange(8, 2, 2);
      const registrantIds = registrantIdsRange.getValues().flat() as [
        RegistrantId,
        RegistrantId,
      ];
      const rowIndex = resultRows.findIndex(
        (resultRow) =>
          resultRow[0] == matchDetails[0] &&
          resultRow[1] == currentSet &&
          resultRow[2] == registrantIds[0],
      );
      const columnIndex = resultRows[rowIndex].findIndex((result) => !result);
      resultsSheet
        .getRange(rowIndex + 2, columnIndex + 1, 2)
        .setValues(results);
      resultRows = getResultRows(resultsSheet);
      const matchSetIndexes: number[] = [];
      setsCounts.forEach((setsCount, i) => {
        if (setsCount + 1 > Number(matchDetails[1].at(-1)) / 2) {
          matchSetIndexes.push(i);
        }
      });
      if (matchSetIndexes.length > 0) {
        const winnersRows = getSetWinners(
          eventId,
          resultRows.slice(0, rowIndex + 2),
        );
        if (
          winnersRows.length === 1 &&
          matchSetIndexes.includes(registrantIds.indexOf(winnersRows[0][2]!))
        ) {
          const winnerRegistrantId = winnersRows[0][2]! as RegistrantId;
          const loserRegistrantId = registrantIds.find(
            (registrantId) => registrantId !== winnerRegistrantId,
          )! as RegistrantId;
          const MATCHES_AND_INDEXES_AND_IDS: Record<
            SupportedEventId,
            Record<number, [number, number, RegistrantId][]>
          > = {
            ///////////////////////////////////////////////////
            333: {
              1: [[9, 0, winnerRegistrantId]],
              2: [[9, 1, winnerRegistrantId]],
              3: [[10, 0, winnerRegistrantId]],
              4: [[10, 1, winnerRegistrantId]],
              5: [[11, 0, winnerRegistrantId]],
              6: [[11, 1, winnerRegistrantId]],
              7: [[12, 0, winnerRegistrantId]],
              8: [[12, 1, winnerRegistrantId]],
              9: [[13, 0, winnerRegistrantId]],
              10: [[13, 1, winnerRegistrantId]],
              11: [[14, 0, winnerRegistrantId]],
              12: [[14, 1, winnerRegistrantId]],
              13: [
                [15, 0, loserRegistrantId],
                [16, 0, winnerRegistrantId],
              ],
              14: [
                [15, 1, loserRegistrantId],
                [16, 1, winnerRegistrantId],
              ],
            },
            444: {
              1: [[5, 0, winnerRegistrantId]],
              2: [[5, 1, winnerRegistrantId]],
              3: [[6, 0, winnerRegistrantId]],
              4: [[6, 1, winnerRegistrantId]],
              5: [
                [7, 0, loserRegistrantId],
                [8, 0, winnerRegistrantId],
              ],
              6: [
                [7, 1, loserRegistrantId],
                [8, 1, winnerRegistrantId],
              ],
            },
            ///////////////////////////////////////////////////
          };
          const matchesAndIndexesAndIds =
            MATCHES_AND_INDEXES_AND_IDS[eventId][matchDetails[0]];
          matchesAndIndexesAndIds &&
            matchesAndIndexesAndIds.forEach((matchAndIndexAndId) => {
              const addIndexes: number[] = [];
              resultRows.forEach((resultRow, i) => {
                if (
                  resultRow[0] === matchAndIndexAndId[0] &&
                  (i + matchAndIndexAndId[1]) % 2 === 0
                ) {
                  addIndexes.push(i);
                }
              });
              addIndexes.forEach((addIndex) =>
                resultsSheet
                  .getRange(addIndex + 2, 3)
                  .setValue(matchAndIndexAndId[2]),
              );
            });
          const deleteCondition = (resultRow: ResultRow) =>
            resultRow[0] === matchDetails[0] && !resultRow[3];
          const deleteFrom =
            resultRows.findIndex((resultRow) => deleteCondition(resultRow)) + 2;
          if (deleteFrom > 1) {
            resultsSheet.deleteRows(
              deleteFrom,
              resultRows.filter((resultRow) => deleteCondition(resultRow))
                .length,
            );
          }
          resultRows = getResultRows(resultsSheet);
          if (resultRows.at(-1)![3]) {
            matchDetailsRange.clearContent();
            registrantIdsRange.clearContent();
            resultsRange.clearContent();
            return;
          }
        }
      }
    }
    resultRows = getResultRows(resultsSheet);
    for (let i = 1; i < resultRows.length; i += 2) {
      const winnersRows = getSetWinners(eventId, resultRows.slice(0, i + 1));
      if (winnersRows.length === 2) {
        const [currentMatch, currentSet] = winnersRows[0];
        const registrantIds = winnersRows.map(
          (winnerRow) => winnerRow[2] as RegistrantId,
        );
        const matchRows = resultRows.filter(
          (resultRow) => resultRow[0] === currentMatch,
        );
        const matchFormat = `Bo${matchRows.length / 2}`;
        const setsCounts = [0, 0];
        if (currentSet > 1) {
          const previousRows = resultRows.slice(0, i - 1);
          for (let j = 1; j <= currentSet - 1; j++) {
            if (
              getSetWinners(
                eventId,
                previousRows.filter(
                  (row) => row[0] < currentMatch || row[1] <= j,
                ),
              )[0][2] === registrantIds[0]
            ) {
              setsCounts[0]++;
            } else {
              setsCounts[1]++;
            }
          }
        }
        const points = getPoints(winnersRows as [ResultRow, ResultRow]);
        scoretakingSheet
          .getRange(2, 3, 4)
          .setValues([
            [currentMatch],
            [matchFormat],
            [`${setsCounts[0]} - ${setsCounts[1]}`],
            [`${points[0]} - ${points[1]}`],
          ]);
        scoretakingSheet
          .getRange(8, 2, 2)
          .setValues(winnersRows.map((winnerRow) => [winnerRow[2]]));
        scoretakingSheet.getRange(8, 5, 2).clearContent();
        break;
      }
    }
  } catch (err) {
    showError(err as string);
  }
};

///////////////////////////////////////////////////
const submitResults333 = () => submitResults("333");
const submitResults444 = () => submitResults("444");
///////////////////////////////////////////////////
