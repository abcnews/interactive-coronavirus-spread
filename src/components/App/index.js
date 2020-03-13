import React, { useState } from "react";
import styles from "./styles.scss";
import Scrollyteller from "@abcnews/scrollyteller";

export default ({ scrollyData }) => {
  const [booms, setBooms] = useState(0);

  return (
    <Scrollyteller panels={scrollyData.panels}>
      <div>{booms || "no booms"}</div>
    </Scrollyteller>
  );
};
