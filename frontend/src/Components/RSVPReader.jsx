import React from "react";
import styles from "./RSVPReader.module.css";

export default function RSVPReader({ currentWord }) {
  return (
    <div className={styles.rsvpContainer}>
      <span className={styles.rsvpWord}>{currentWord}</span>
    </div>
  );
}