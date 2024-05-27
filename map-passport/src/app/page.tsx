import Image from "next/image";
import styles from "./page.module.css";
import MapChart from "@/components/home-map";

export default function Home() {
  return (
    <main className={styles.main}>
      <h2 className="home-title">Worldwide Passports</h2>
      <p className={styles.w40}>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Temporibus, accusamus? Accusantium sunt eligendi praesentium tempore at illo odio?</p>

      <div className="map-section">
        <MapChart />
      </div>
    </main>
  );
}
