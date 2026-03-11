import { useEffect, useState } from "react";

export default function PointsCard() {
  const [points, setPoints] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;

    fetch("http://127.0.0.1:3000/submit-image", {
      headers: {
        role: "user",
        "user-id": userId
      }
    });
  }, []);

  return (
    <div>
      <h3>Points</h3>
      <p>Total: (shown after actions)</p>
      <p>Monthly: (shown after actions)</p>
      <p>Yearly: (shown after actions)</p>
    </div>
  );
}
