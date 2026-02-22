import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io(import.meta.env.VITE_SOCKET_URL);

type SuccessGrid = {
  _id: string;
  windowStart: string;
  bucketsCovered: number;
  computedAt: number;
  failCount: number;
  successCount: number;
  successRate: number;
  totalRecords: number;
  windowEnd: number;
};

function App() {
  const [successGrid, setSuccessGrid] = useState<SuccessGrid[]>([]);

  useEffect(() => {
    (() => {
      socket.on("success-rate", (data) => {
        console.log("success-rate", data)
        setSuccessGrid(data);
      });
      return () => socket.off("success-rate");
    })();
  }, []);

  if (!successGrid) return <div>Waiting for stream...</div>;

  return (
    <>
      <h1>Syook Dashboard</h1>
      <div>
        <table border={1} cellPadding="8">
          <thead>
            <tr>
              <th>Time</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {successGrid.map((successRow) => (
              <tr key={successRow._id}>
                <td>{successRow.windowStart}</td>
                <td>{successRow.successRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default App;
