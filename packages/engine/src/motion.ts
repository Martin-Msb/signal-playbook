/** Start time and total duration for rides shown in one step, in source order. */
export function rideQueue(durations: number[]): { offset: number; total: number }[] {
  let total = 0;
  return durations.map((duration) => {
    const offset = total;
    total += duration;
    return { offset, total };
  });
}

/** A ride keeps its original label while travelling and changes it only when it arrives. */
export function rideArrivalLabel(label: string, then: string | undefined, arrived: boolean): string {
  return arrived && then ? then : label;
}
