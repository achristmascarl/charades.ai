import { useState, useEffect } from 'react';

export default function FoundleCountdown() {
  const [countdownString, setCountdownString] = useState("--:--:--");

  // get countdown clock
  useEffect(() => {
    setInterval(() => getCountdownString(), 1000);
  }, []);

  function getCountdownString() {
    const utcDate = new Date();
    const currentDate = new Date(Date.now());
    utcDate.setUTCHours(utcDate.getUTCHours() + 20);
    utcDate.setUTCHours(4, 0, 0, 0);
    const msTimeDiff = utcDate - currentDate;
    let seconds = Math.floor(msTimeDiff / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    seconds = seconds % 60;
    minutes = minutes % 60;
    const stringHours = hours < 10 ? `0${hours}` : `${hours}`;
    const stringMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const stringSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    setCountdownString(`${stringHours}:${stringMinutes}:${stringSeconds}`);
  }

  return (
    <>{countdownString}</>
  );
}
