# Top 8 Bracket Wireframe (Completed League View)

```
+-------------------------------------------------------------+
|                  FINAL LEAGUE STANDINGS                     |
|  --------------------------------------------------------   |
|  | # | Player Name | Leg 1 | Leg 2 | ... | Total Points |   |
|  |---|------------|-------|-------|-----|--------------|   |
|  | 1 | ...        |   3   |   2   | ... |     18       |   |
|  | 2 | ...        |   2   |   3   | ... |     16       |   |
|  |...|            |       |       |     |              |   |
|  --------------------------------------------------------   |
+-------------------------------------------------------------+

+---------------------+     +-------------------+     +------------------+
|   QF1               |     |     SF1           |     |     FINAL        |
|  [P1] 3   vs   1 [P2]---->| [Winner QF1]      |---->| [Winner SF1]     |
+---------------------+     | 3   vs   2        |     | 3   vs   0       |
                            +-------------------+     +------------------+
+---------------------+     |     SF2           |
|   QF2               |     | [Winner QF2]      |
|  [P3] 3   vs   2 [P4]---->| 3   vs   1        |
+---------------------+     +-------------------+
                                 |
+---------------------+          |
|   QF3               |          |
|  [P5] 1   vs   3 [P6]----------+
+---------------------+
                                 |
+---------------------+          |
|   QF4               |          |
|  [P7] 0   vs   3 [P8]----------+
+---------------------+
```

**Legend:**
- QF = Quarterfinal, SF = Semifinal, FINAL = Final
- `[P1] 3 vs 1 [P2]` means Player 1 scored 3, Player 2 scored 1
- Arrows show which QF winners advance to which SF, and SF winners to Final
- The bracket is read-only, just like your image

**How it will look in the app:**
- Standings table at the top (as on `/to/legs`)
- Bracket below, with 4 QF cards on the left, 2 SF cards in the middle, 1 Final card on the right
- Each card shows both players and the result, with the winner visually indicated 