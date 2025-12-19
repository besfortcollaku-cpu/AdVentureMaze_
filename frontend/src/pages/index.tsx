import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import dynamic from "next/dynamic";
import Script from "next/script";
import PhaserGame from "../PhaserGame"
const inter = Inter({ subsets: ["latin"] });

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
                <meta name="description" content=" Pi Maze Rewards Game." />
                <link rel="icon" href="/favicon.png" />
            </Head>
              <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive"/>

<Script id="pi-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html:`if (window.Pi) {window.Pi.init({ version: "2.0", sandbox:true });
        console.log("Pi SDK initialized");
      } else {
        console.log("Pi SDK NOT found");
      }
    `,
  }}
/>

            <main className={`${styles.main} ${inter.className}`}>
                <AppWithoutSSR />
            </main>
        </>
    );
}
