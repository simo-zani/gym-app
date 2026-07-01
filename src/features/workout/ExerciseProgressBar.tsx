/**
 * ExerciseProgressBar
 *
 * A horizontal segmented bar that represents all phases of a timed exercise:
 *   [Prep 10s] [Set 1] [Rest 1] [Set 2] [Rest 2] ... [Set N] [Cooldown 30s]
 *
 * Props:
 *   totalSets       – number of sets in this exercise
 *   currentPhase    – the current Phase kind (warmup / exercising / timed_running / cooldown)
 *   currentSet      – 1-based current set number
 *   nextSetAfterRest– set number that comes after the current rest (used to color the right rest gap)
 *   currentProgress – a value between 0 and 1 representing the completion of the active step
 */

interface Props {
  totalSets: number;
  currentPhase: 'warmup' | 'exercising' | 'timed_running' | 'resting' | 'cooldown';
  currentSet: number;   // 1-based
  nextSetAfterRest?: number; // only meaningful when currentPhase === 'resting'
  currentProgress?: number;  // 0 to 1 representing fill level of active step
}

export function ExerciseProgressBar({
  totalSets,
  currentPhase,
  currentSet,
  nextSetAfterRest,
  currentProgress = 0,
}: Props) {
  // Build the ordered segment list:
  // [warmup, set1, rest1, set2, rest2, ..., setN, cooldown]
  type Seg =
    | { id: string; kind: 'warmup' | 'cooldown'; weight: number }
    | { id: string; kind: 'set'; setNum: number; weight: number }
    | { id: string; kind: 'rest'; afterSet: number; weight: number };

  const segments: Seg[] = [];

  // Prep
  segments.push({ id: 'warmup', kind: 'warmup', weight: 1 });

  for (let s = 1; s <= totalSets; s++) {
    segments.push({ id: `set-${s}`, kind: 'set', setNum: s, weight: 3 });
    if (s < totalSets) {
      segments.push({ id: `rest-${s}`, kind: 'rest', afterSet: s, weight: 1.5 });
    }
  }

  // Cooldown
  segments.push({ id: 'cooldown', kind: 'cooldown', weight: 1 });

  // Determine fill state for each segment
  function segmentState(seg: Seg): 'done' | 'active' | 'future' {
    if (seg.kind === 'warmup') {
      if (currentPhase === 'warmup') return 'active';
      return 'done'; // any later phase means warmup is done
    }

    if (seg.kind === 'set') {
      const { setNum } = seg;
      if (setNum < currentSet) return 'done';
      if (setNum === currentSet) {
        if (currentPhase === 'exercising' || currentPhase === 'timed_running') return 'active';
        if (currentPhase === 'resting' || currentPhase === 'cooldown') return 'done';
        return 'future';
      }
      return 'future';
    }

    if (seg.kind === 'rest') {
      const { afterSet } = seg;
      if (currentPhase === 'resting' && nextSetAfterRest !== undefined) {
        const restingAfterSet = nextSetAfterRest - 1;
        if (afterSet < restingAfterSet) return 'done';
        if (afterSet === restingAfterSet) return 'active';
        return 'future';
      }
      // If not resting, check against current set
      if (afterSet < currentSet - 1) return 'done';
      if (afterSet === currentSet - 1) {
        // We just finished this set and moved past the rest
        if (currentPhase !== 'resting') return 'done';
        return 'future';
      }
      return 'future';
    }

    // cooldown
    if (seg.kind === 'cooldown') {
      if (currentPhase === 'cooldown') return 'active';
      return 'future';
    }

    return 'future';
  }

  const totalWeight = segments.reduce((s, seg) => s + seg.weight, 0);

  // Each phase keeps its own colour, used for both the completed (done) and the
  // in-progress (active) fill — matching the colour of that phase's timer ring.
  const phaseFill: Record<Seg['kind'], string> = {
    warmup: 'bg-amber-500',
    set: 'bg-successGreen',
    rest: 'bg-blueSoft',
    cooldown: 'bg-purple-500',
  };

  return (
    <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-bg-0">
      {segments.map((seg) => {
        const state = segmentState(seg);
        const flexBasis = `${(seg.weight / totalWeight) * 100}%`;

        // Fill percentage
        let fillWidth = '0%';
        let fillColor = '';

        if (state === 'done') {
          fillWidth = '100%';
          fillColor = phaseFill[seg.kind];
        } else if (state === 'active') {
          // Fill based on current progress — no animate-pulse to avoid flicker
          fillWidth = `${Math.min(100, Math.max(0, currentProgress * 100))}%`;
          fillColor = phaseFill[seg.kind];
        }

        let rounded = '';
        if (seg.id === 'warmup') rounded = 'rounded-l-full';
        if (seg.id === 'cooldown') rounded = 'rounded-r-full';

        return (
          <div
            key={seg.id}
            className={`relative h-full bg-bg-2 overflow-hidden ${rounded}`}
            style={{ flexBasis }}
          >
            <div
              className={`absolute top-0 left-0 h-full transition-[width] duration-300 ease-linear ${fillColor}`}
              style={{ width: fillWidth }}
            />
          </div>
        );
      })}
    </div>
  );
}
