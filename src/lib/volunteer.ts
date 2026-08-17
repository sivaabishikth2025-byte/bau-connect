import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { VolunteerApplication, VolunteerAppStatus } from "@/types";

export function hiredCount(apps: VolunteerApplication[], jobId: string) {
  return apps.filter(a => a.jobId === jobId && a.status === "hired").length;
}

export function isHired(app?: VolunteerApplication | null) {
  return app?.status === "hired";
}

export async function syncHiredRoster(jobId: string, applicantId: string, status: VolunteerAppStatus) {
  const ref = doc(db, "volunteers", jobId);
  if (status === "hired") {
    await updateDoc(ref, { participantIds: arrayUnion(applicantId) });
  } else {
    await updateDoc(ref, { participantIds: arrayRemove(applicantId) });
  }
}
