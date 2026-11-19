import { IBM_Plex_Sans } from "next/font/google";
const plex = IBM_Plex_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "600", "700"] });
export const fontVariables = plex.variable;
