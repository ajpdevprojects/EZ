import { remoteOkSource } from "./remoteok";
import { remotiveSource } from "./remotive";
import type { JobSourceAdapter } from "../types";

/** All public job sources the Software Engine collects from. Add new adapters here. */
export const JOB_SOURCES: JobSourceAdapter[] = [remoteOkSource, remotiveSource];

export { remoteOkSource, remotiveSource };
