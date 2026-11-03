import { redirect } from "next/navigation";

/** The inbox is the desk's front page. */
export default function DeskHome() {
  redirect("/cs/inquiries");
}
