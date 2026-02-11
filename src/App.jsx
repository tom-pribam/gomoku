import { useState } from "react";
import "./App.css";

const BOARD_SIZE = 30;
const WIN_LENGTH = 5;
const SCORES_STORAGE_KEY = "gomoku-scores";

const defaultScores = () => ({ blue: 0, red: 0 });

const loadScores = () => {
  try {
    const raw = localStorage.getItem(SCORES_STORAGE_KEY);
    if (!raw) return defaultScores();
    const parsed = JSON.parse(raw);
    return {
      blue: Number(parsed.blue) || 0,
      red: Number(parsed.red) || 0,
    };
  } catch {
    return defaultScores();
  }
};

const saveScores = (scores) => {
  try {
    localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // ignore write errors
  }
};

function App() {
  const [board, setBoard] = useState(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("blue");
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [scores, setScores] = useState(() => loadScores());
  const [moveHistory, setMoveHistory] = useState([]);

  const getMaxStreakForPlayer = (squares, player) => {
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    let maxStreak = 0;

    for (let index = 0; index < squares.length; index++) {
      if (squares[index] !== player) continue;

      const row = Math.floor(index / BOARD_SIZE);
      const col = index % BOARD_SIZE;

      for (const [dx, dy] of directions) {
        let count = 1;

        for (let i = 1; ; i++) {
          const newRow = row + dx * i;
          const newCol = col + dy * i;
          if (
            newRow < 0 ||
            newRow >= BOARD_SIZE ||
            newCol < 0 ||
            newCol >= BOARD_SIZE
          )
            break;
          const newIndex = newRow * BOARD_SIZE + newCol;
          if (squares[newIndex] === player) {
            count++;
          } else {
            break;
          }
        }

        for (let i = 1; ; i++) {
          const newRow = row - dx * i;
          const newCol = col - dy * i;
          if (
            newRow < 0 ||
            newRow >= BOARD_SIZE ||
            newCol < 0 ||
            newCol >= BOARD_SIZE
          )
            break;
          const newIndex = newRow * BOARD_SIZE + newCol;
          if (squares[newIndex] === player) {
            count++;
          } else {
            break;
          }
        }

        if (count > maxStreak) {
          maxStreak = count;
        }
      }
    }

    return maxStreak;
  };

  const checkWinner = (squares, index) => {
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    const player = squares[index];

    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    for (const [dx, dy] of directions) {
      let count = 1;
      const line = [index];

      for (let i = 1; i < WIN_LENGTH; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (
          newRow < 0 ||
          newRow >= BOARD_SIZE ||
          newCol < 0 ||
          newCol >= BOARD_SIZE
        )
          break;
        const newIndex = newRow * BOARD_SIZE + newCol;
        if (squares[newIndex] === player) {
          count++;
          line.push(newIndex);
        } else break;
      }

      for (let i = 1; i < WIN_LENGTH; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (
          newRow < 0 ||
          newRow >= BOARD_SIZE ||
          newCol < 0 ||
          newCol >= BOARD_SIZE
        )
          break;
        const newIndex = newRow * BOARD_SIZE + newCol;
        if (squares[newIndex] === player) {
          count++;
          line.push(newIndex);
        } else break;
      }

      if (count >= WIN_LENGTH) {
        return { winner: player, line };
      }
    }

    return null;
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;

    if (!gameStarted) setGameStarted(true);

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const maxStreak = getMaxStreakForPlayer(newBoard, currentPlayer);
    const now = new Date();
    const timeLabel = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setMoveHistory((prev) => [
      ...prev,
      {
        time: timeLabel,
        player: currentPlayer,
        maxStreak,
      },
    ]);

    const result = checkWinner(newBoard, index);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      const nextScores = {
        blue: result.winner === "blue" ? scores.blue + 1 : scores.blue,
        red: result.winner === "red" ? scores.red + 1 : scores.red,
      };
      setScores(nextScores);
      saveScores(nextScores);
    } else {
      setCurrentPlayer(currentPlayer === "blue" ? "red" : "blue");
    }
  };

  const restartGame = () => {
    setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
    setCurrentPlayer("blue");
    setWinner(null);
    setWinningLine([]);
    setMoveHistory([]);
    setGameStarted(true);
  };

  return (
    <div className="game-container">
      <div className="header">
        <div
          className={`player-indicator ${
            currentPlayer === "blue" && !winner ? "active" : ""
          }`}
        >
          <div className="stone blue"></div>
          <span className="player-name">Player 1</span>
          <span className="player-wins">
            {scores.blue} {scores.blue === 1 ? "win" : "wins"}
          </span>
          {winner === "blue" && <span className="winner-badge">🏆</span>}
        </div>

        <div className="title-section">
          <h1>Gomoku</h1>
          <button onClick={restartGame} className="reset-btn" type="button">
            Restart
          </button>
        </div>

        <div
          className={`player-indicator ${
            currentPlayer === "red" && !winner ? "active" : ""
          }`}
        >
          <div className="stone red"></div>
          <span className="player-name">Player 2</span>
          <span className="player-wins">
            {scores.red} {scores.red === 1 ? "win" : "wins"}
          </span>
          {winner === "red" && <span className="winner-badge">🏆</span>}
        </div>
      </div>

      <div className="game-layout">
        <div className="board">
          {board.map((value, index) => (
            <div
              key={index}
              className={`cell ${value ? value : ""} ${
                winningLine.includes(index) ? "winning" : ""
              }`}
              onClick={() => handleClick(index)}
            >
              {value && <div className={`stone ${value}`}></div>}
            </div>
          ))}
        </div>

        <aside className="sidebar">
          <h2 className="sidebar-title">Move history</h2>
          {moveHistory.length === 0 ? (
            <p className="sidebar-empty">No moves yet.</p>
          ) : (
            <div className="sidebar-table-wrapper">
              <table className="moves-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Player</th>
                    <th>Longest streak</th>
                  </tr>
                </thead>
                <tbody>
                  {moveHistory.map((move, idx) => (
                    <tr key={`${move.time}-${idx}`}>
                      <td>{move.time}</td>
                      <td>
                        <span
                          className={`move-player-badge ${
                            move.player === "blue" ? "blue" : "red"
                          }`}
                        >
                          {move.player === "blue" ? "Player 1" : "Player 2"}
                        </span>
                      </td>
                      <td>{move.maxStreak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </aside>
      </div>

      {winner && (
        <div className="modal-overlay" onClick={restartGame}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎉 Congratulations!</h2>
            <p>
              <span className={winner}>
                Player {winner === "blue" ? "1" : "2"}
              </span>{" "}
              wins!
            </p>
            <button onClick={restartGame} className="modal-btn" type="button">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
