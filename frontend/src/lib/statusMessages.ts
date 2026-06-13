import type { Measurement, GoalMap, Profile } from './types'
import { fatCategory, visceralCategory, waterCategory, genderNoun, isFatImproving, bmiCategory } from './references'

// Pick a message from a pool, rotating each time there's a new measurement
function pick(pool: string[], seed: number): string {
  return pool[seed % pool.length]
}

export function getStatusMessage(
  measurements: Measurement[],
  profile: Profile | null,
  goals: GoalMap
): string {
  const firstName = profile?.name?.split(' ')[0] || 'there'
  const gender = profile?.gender ?? null
  const ethnicity = profile?.ethnicity ?? null
  const gNoun = genderNoun(gender)

  if (measurements.length === 0) {
    return pick([
      `No measurements yet, ${firstName}. Drop your TANITA folder below and we'll get started.`,
      `Ready when you are, ${firstName}. Import your TANITA data and this dashboard comes alive.`,
      `Nothing here yet, ${firstName}. Add your first measurement and your health story begins.`,
      `Waiting on your data, ${firstName}. Drop that TANITA folder and let's see what you've got.`,
    ], 0)
  }

  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  )
  const latest = sorted[sorted.length - 1]
  const prev3 = sorted.slice(-4, -1)
  const seed = measurements.length

  // ── Priority 1: Visceral fat alert ──────────────────────────────────────────
  const viscat = visceralCategory(latest.visceral_fat)
  if (viscat === 'high') {
    return pick([
      `Visceral fat is at level ${latest.visceral_fat} — that's above the healthy range of 1–12, ${firstName}. This one's worth prioritising: cutting refined carbs and adding cardio moves the needle fastest.`,
      `Level ${latest.visceral_fat} visceral fat is in the red zone, ${firstName}. The good news: visceral fat responds really well to consistent cardio and diet changes. Let's bring this down.`,
      `Your visceral fat is at ${latest.visceral_fat}, ${firstName}. That's above where we want it. The body is remarkably good at clearing this with steady effort — cardio first, diet second.`,
      `${firstName}, visceral fat at level ${latest.visceral_fat} is the one number I'd focus on right now. It's above the safe range, but it's also the most responsive to lifestyle changes. Start there.`,
      `Level ${latest.visceral_fat} is higher than we'd like on visceral fat, ${firstName}. This is the fat that matters most for internal health — and fortunately it's also the first to go when you dial in the cardio.`,
    ], seed)
  }

  // ── Priority 2: Goal milestones ──────────────────────────────────────────────
  const goalMessages: string[] = []

  // Weight goal
  if (goals.weight_kg != null && latest.weight_kg != null) {
    const diff = latest.weight_kg - goals.weight_kg
    if (Math.abs(diff) <= 0.3) {
      goalMessages.push(`You hit your weight goal of ${goals.weight_kg} kg, ${firstName}. That's real work. Time to set the next target.`)
      goalMessages.push(`${goals.weight_kg} kg — goal reached, ${firstName}. What's next on the list?`)
      goalMessages.push(`There it is, ${firstName}. ${goals.weight_kg} kg. You said you'd do it and you did it.`)
      goalMessages.push(`Weight goal: done. ${goals.weight_kg} kg, ${firstName}. Take a moment — then set a new one.`)
      goalMessages.push(`${firstName}, you're at ${goals.weight_kg} kg. That's not luck, that's consistency paying off.`)
    } else if (diff > 0 && diff <= goals.weight_kg * 0.04) {
      goalMessages.push(`Just ${diff.toFixed(1)} kg away from your weight goal. You can almost touch it, ${firstName}.`)
      goalMessages.push(`${diff.toFixed(1)} kg to go on weight. You're in the home stretch, ${firstName}.`)
      goalMessages.push(`${firstName}, you're ${diff.toFixed(1)} kg from your target. This close, the discipline that got you here is the same discipline that finishes it.`)
      goalMessages.push(`So close, ${firstName}. ${diff.toFixed(1)} kg stands between you and that weight goal.`)
      goalMessages.push(`${diff.toFixed(1)} kg from the finish line on weight. Don't change anything — whatever you're doing is working.`)
    }
  }

  // Fat % goal
  if (goals.fat_total_pct != null && latest.fat_total_pct != null) {
    const diff = latest.fat_total_pct - goals.fat_total_pct
    if (Math.abs(diff) <= 0.3) {
      goalMessages.push(`Body fat goal achieved — ${latest.fat_total_pct.toFixed(1)}% is right on target, ${firstName}. Nicely done.`)
      goalMessages.push(`You're at ${latest.fat_total_pct.toFixed(1)}% body fat — exactly where you wanted to be, ${firstName}.`)
      goalMessages.push(`${latest.fat_total_pct.toFixed(1)}% body fat, ${firstName}. You set that goal and you hit it. That's the whole deal.`)
      goalMessages.push(`Fat goal: checked. ${firstName}, ${latest.fat_total_pct.toFixed(1)}% is exactly where you aimed. Now raise the bar.`)
      goalMessages.push(`${firstName}, you said ${goals.fat_total_pct}% and you got ${latest.fat_total_pct.toFixed(1)}%. That's not a coincidence — that's what sustained effort looks like.`)
    } else if (diff > 0 && diff <= 1.5) {
      goalMessages.push(`Just ${diff.toFixed(1)}% to go on your fat goal, ${firstName}. You're close.`)
      goalMessages.push(`${diff.toFixed(1)}% off your body fat target — the finish line is in sight, ${firstName}.`)
      goalMessages.push(`${firstName}, you're ${diff.toFixed(1)}% away from your fat goal. The hardest part is behind you.`)
      goalMessages.push(`Almost there on body fat, ${firstName}. ${diff.toFixed(1)}% is all that's left between you and that goal.`)
      goalMessages.push(`${diff.toFixed(1)}% to go, ${firstName}. Don't rush it — just keep doing what's been working.`)
    }
  }

  // Muscle goal
  if (goals.muscle_total_kg != null && latest.muscle_total_kg != null) {
    const diff = latest.muscle_total_kg - goals.muscle_total_kg
    if (diff >= 0) {
      goalMessages.push(`Muscle goal cleared at ${latest.muscle_total_kg.toFixed(1)} kg, ${firstName}. Time to raise the bar.`)
      goalMessages.push(`You've passed your muscle goal, ${firstName}. Set a new one so you have something to chase.`)
      goalMessages.push(`${latest.muscle_total_kg.toFixed(1)} kg of muscle, ${firstName}. You cleared the target. Now make it harder.`)
      goalMessages.push(`Muscle goal hit, ${firstName}. ${latest.muscle_total_kg.toFixed(1)} kg — every rep built this.`)
      goalMessages.push(`${firstName}, your muscle is at ${latest.muscle_total_kg.toFixed(1)} kg — past your goal. The work is real. Set a new one.`)
    } else if (Math.abs(diff) <= 1.5) {
      goalMessages.push(`${Math.abs(diff).toFixed(1)} kg away from your muscle goal. Keep the resistance training consistent, ${firstName}.`)
      goalMessages.push(`So close on muscle — just ${Math.abs(diff).toFixed(1)} kg to go, ${firstName}.`)
      goalMessages.push(`${firstName}, you're ${Math.abs(diff).toFixed(1)} kg short of your muscle goal. The training is working — stay patient.`)
      goalMessages.push(`${Math.abs(diff).toFixed(1)} kg to go on muscle, ${firstName}. Keep loading the bar.`)
      goalMessages.push(`You're this close on muscle, ${firstName}. ${Math.abs(diff).toFixed(1)} kg. Don't stop now.`)
    }
  }

  if (goalMessages.length > 0) {
    return pick(goalMessages, seed)
  }

  // ── Priority 3: Multiple goals set — progress messages ───────────────────────
  const hasGoals = Object.keys(goals).length > 0
  if (hasGoals && prev3.length >= 1) {
    const avg = (field: keyof Measurement) => {
      const vals = prev3.map(m => m[field] as number | null).filter((v): v is number => v != null)
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
    }
    const wAvg = avg('weight_kg')
    const fAvg = avg('fat_total_pct')
    const mAvg = avg('muscle_total_kg')
    const wDiff = wAvg != null && latest.weight_kg != null ? latest.weight_kg - wAvg : null
    const fDiff = fAvg != null && latest.fat_total_pct != null ? latest.fat_total_pct - fAvg : null
    const mDiff = mAvg != null && latest.muscle_total_kg != null ? latest.muscle_total_kg - mAvg : null

    const movingTowardGoals: string[] = []
    if (goals.weight_kg != null && wDiff != null && latest.weight_kg! > goals.weight_kg && wDiff < -0.2)
      movingTowardGoals.push('weight is coming down')
    if (goals.fat_total_pct != null && fDiff != null && latest.fat_total_pct! > goals.fat_total_pct && fDiff < -0.3)
      movingTowardGoals.push('fat percentage is dropping')
    if (goals.muscle_total_kg != null && mDiff != null && latest.muscle_total_kg! < goals.muscle_total_kg && mDiff > 0.1)
      movingTowardGoals.push('muscle is building')

    if (movingTowardGoals.length > 0) {
      return pick([
        `${firstName}, you're moving in the right direction on your goals — ${movingTowardGoals.join(' and ')}.`,
        `Progress toward your goals: ${movingTowardGoals.join(', ')}. Keep the consistency, ${firstName}.`,
        `The numbers are trending toward your targets, ${firstName} — ${movingTowardGoals.join(' and ')}.`,
        `It's working, ${firstName}. ${movingTowardGoals.join(' and ')} — the goals are getting closer.`,
        `${firstName}, the data doesn't lie: ${movingTowardGoals.join(', ')}. You're on the right path.`,
        `Every measurement tells a story, ${firstName}, and yours right now is: ${movingTowardGoals.join(' and ')}.`,
      ], seed)
    }
  }

  // ── Priority 4: Body fat vs gender/age reference ─────────────────────────────
  const fatCat = fatCategory(latest.fat_total_pct, gender, latest.age, ethnicity)

  const fatImproving = prev3.length > 0
    ? isFatImproving(latest.fat_total_pct, prev3[prev3.length - 1].fat_total_pct, gender, latest.age, ethnicity)
    : false

  if (fatCat === 'excellent') {
    return pick([
      `Your body fat is in the excellent range for ${gNoun} your age, ${firstName}. That's a strong foundation — keep it there.`,
      `Excellent body fat percentage for your profile, ${firstName}. You're ahead of the average ${gNoun} in your age group.`,
      `Body fat in the excellent range, ${firstName}. That puts you well ahead of most ${gNoun} your age.`,
      `${firstName}, your body composition is genuinely excellent for your age. Whatever your routine is — it's working.`,
      `Excellent category on body fat, ${firstName}. Most people never get here. You did the work.`,
      `You're in the excellent range for body fat, ${firstName}. That's not where most ${gNoun} your age land. It's worth protecting.`,
    ], seed)
  }

  if (fatCat === 'good') {
    if (fatImproving) {
      return pick([
        `Your body fat is in the good range and still improving, ${firstName}. Excellent category is within reach.`,
        `You're in the good range for ${gNoun} your age on body fat, and the trend is pointing the right way, ${firstName}.`,
        `Good range and trending better, ${firstName}. That's not a plateau — that's progress still happening.`,
        `Body fat: good range, heading up toward excellent, ${firstName}. Stay the course.`,
        `The trajectory is right, ${firstName}. Good body fat today, excellent body fat if you keep this up.`,
      ], seed)
    }
    return pick([
      `Body fat is in the good range for ${gNoun} your age, ${firstName}. Solid.`,
      `You're doing well on body composition, ${firstName} — good range for your age and gender.`,
      `Good body fat range, ${firstName}. You're in solid shape for ${gNoun} your age.`,
      `${firstName}, your body fat puts you in the good category. That's where most people are working hard just to reach.`,
      `Sitting in the good range on body fat, ${firstName}. Not just average — genuinely good.`,
    ], seed)
  }

  if (fatCat === 'high') {
    if (fatImproving) {
      return pick([
        `Body fat is still above the average for ${gNoun} your age, but it's heading the right way, ${firstName}. Keep the momentum.`,
        `The trend is good, ${firstName} — fat is coming down even if there's still ground to cover against the reference for your age group.`,
        `You're above range on body fat but moving toward it, ${firstName}. That direction is everything.`,
        `It's going down, ${firstName}. Body fat is still above the reference for ${gNoun} your age, but the trend is your best news.`,
        `Progress is real, ${firstName}. Body fat is dropping — it's not in range yet, but the needle is moving the right way.`,
      ], seed)
    }
    return pick([
      `Body fat is currently above the reference range for ${gNoun} your age, ${firstName}. Small, consistent changes in diet and training move this metric more than anything.`,
      `There's room to lower body fat below the average for ${gNoun} your age, ${firstName}. The data gives you a clear direction to work from.`,
      `Your body fat is above the healthy range for ${gNoun} your age, ${firstName}. That's what this data is for — giving you something concrete to work on.`,
      `${firstName}, body fat is above the reference range right now. The good news is this number is very responsive to lifestyle changes. Cardio and diet will move it.`,
      `Above the reference range on body fat, ${firstName}. Not a verdict — just a direction. And now you know which way to point.`,
    ], seed)
  }

  // ── Priority 4.5: BMI reference (fires when fat% is not already flagged) ─────
  if (fatCat == null || fatCat === 'average') {
    const bmiCat = bmiCategory(latest.bmi, ethnicity)
    if (bmiCat === 'overweight') {
      return pick([
        `BMI is slightly above the healthy range for your reference group, ${firstName}. Body fat and trends here give you a more complete picture than BMI alone.`,
        `BMI reads as overweight for ${gNoun} in your reference group, ${firstName}. It's one signal — watch the body fat trend alongside it.`,
        `BMI is nudging above the healthy range, ${firstName}. On its own, BMI is a blunt instrument — but it's worth keeping an eye on alongside body fat.`,
        `${firstName}, BMI is slightly elevated for your reference group. It's not the whole story, but it's worth factoring in with everything else here.`,
        `Your BMI puts you just into overweight for your reference group, ${firstName}. That's useful context — but body fat percentage tells you more about what's actually going on.`,
      ], seed)
    }
    if (bmiCat === 'obese') {
      return pick([
        `BMI is above the healthy range for your reference group, ${firstName}. Combined with the body fat data here, you have a clear direction to work from.`,
        `BMI puts you above the recommended range for ${gNoun} in your reference group, ${firstName}. Small, consistent changes in diet and movement move this faster than you'd expect.`,
        `${firstName}, BMI is in the obese range for your reference group. That's hard to read, but it's a starting point — and you're already measuring, which is the first real step.`,
        `Your BMI is above where we'd want it, ${firstName}. The honest truth is this is the number that motivates real change when you commit to it. You have the data — now use it.`,
        `Above the healthy BMI range, ${firstName}. Not a life sentence — just a current position. The people who improve from here are the ones who keep showing up and measuring.`,
      ], seed)
    }
  }

  // ── Priority 5: Visceral fat elevated ────────────────────────────────────────
  if (viscat === 'elevated') {
    return pick([
      `Visceral fat is at level ${latest.visceral_fat} — slightly above the healthy range of 1–12, ${firstName}. Still manageable with consistent cardio and diet tweaks.`,
      `Level ${latest.visceral_fat} visceral fat is in the elevated zone, ${firstName}. Cardio and reducing processed foods are the fastest way to bring it back to healthy range.`,
      `Visceral fat at ${latest.visceral_fat} is a touch above the healthy range, ${firstName}. Nothing alarming, but worth bringing down. Cardio is your best tool here.`,
      `${firstName}, visceral fat is slightly elevated at level ${latest.visceral_fat}. The healthy range tops out at 12 — you're close, but let's close the gap with some consistent cardio.`,
      `Level ${latest.visceral_fat} on visceral fat is just above ideal, ${firstName}. The fix is straightforward: more cardio, fewer processed foods. Your body will respond.`,
    ], seed)
  }

  // ── Priority 6: Trend-based (no reference concerns) ──────────────────────────
  if (prev3.length === 0) {
    return pick([
      `First data point is in, ${firstName}. This is your baseline — every measurement from here tells a story.`,
      `Your baseline is set, ${firstName}. Add measurements consistently and the trends will tell you everything.`,
      `There's your starting line, ${firstName}. The first number is always the most important — it's where everything gets measured from.`,
      `Data point one is locked in, ${firstName}. Come back after your next measurement and we'll start seeing the story.`,
      `${firstName}, your baseline is here. Some people never start — you did. That counts for more than the numbers do right now.`,
    ], seed)
  }

  const avg2 = (field: keyof Measurement) => {
    const vals = prev3.map(m => m[field] as number | null).filter((v): v is number => v != null)
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }
  const wD = avg2('weight_kg') != null && latest.weight_kg != null ? latest.weight_kg - avg2('weight_kg')! : null
  const fD = avg2('fat_total_pct') != null && latest.fat_total_pct != null ? latest.fat_total_pct - avg2('fat_total_pct')! : null
  const mD = avg2('muscle_total_kg') != null && latest.muscle_total_kg != null ? latest.muscle_total_kg - avg2('muscle_total_kg')! : null

  const wDown = wD != null && wD < -0.2
  const wUp = wD != null && wD > 0.2
  const fDown = fD != null && fD < -0.3
  const fUp = fD != null && fD > 0.3
  const mUp = mD != null && mD > 0.1
  const mDown = mD != null && mD < -0.1

  if (wDown && fDown && mUp) return pick([
    `Everything's moving in the right direction, ${firstName} — weight down, fat down, muscle up.`,
    `The triple: weight down, fat down, muscle up. That's exactly the direction you want, ${firstName}.`,
    `Weight, fat, muscle — all moving the right way, ${firstName}. Whatever you're doing, keep it going.`,
    `${firstName}, this is a perfect measurement. Weight down, fat down, muscle up. Don't overthink it — just keep going.`,
    `Three for three, ${firstName}. Weight down, fat down, muscle up. This is what the work looks like when it's paying off.`,
    `That's the one, ${firstName}. Weight down, body fat dropping, muscle climbing. Screenshot this one.`,
  ], seed)

  if (wDown && mUp) return pick([
    `Down ${Math.abs(wD!).toFixed(1)} kg and gaining muscle — that's the ideal combo, ${firstName}.`,
    `Losing weight while building muscle is the hardest thing to do, and you're doing it, ${firstName}.`,
    `${firstName}, ${Math.abs(wD!).toFixed(1)} kg lighter and more muscle. That's not easy to pull off. You're doing it.`,
    `Weight down ${Math.abs(wD!).toFixed(1)} kg, muscle up — ${firstName}, that's the combination everyone's chasing. You've got it.`,
    `${Math.abs(wD!).toFixed(1)} kg less, more muscle, same person working harder. That's you right now, ${firstName}.`,
  ], seed)

  if (fDown && mUp) return pick([
    `Fat is dropping and muscle is building — your composition is shifting in the best possible direction, ${firstName}.`,
    `Body recomposition in progress, ${firstName}. Fat down, muscle up — that's the goal right there.`,
    `${firstName}, fat is falling and muscle is rising. That's a body recomposition happening in real time.`,
    `The composition is shifting, ${firstName}. Less fat, more muscle. This is what the process looks like.`,
    `Fat down, muscle up — ${firstName}, the scale might not always show it, but your body is genuinely changing.`,
  ], seed)

  if (wDown) return pick([
    `Down ${Math.abs(wD!).toFixed(1)} kg compared to your recent average. On track, ${firstName}.`,
    `Weight is trending down — ${Math.abs(wD!).toFixed(1)} kg off your recent average, ${firstName}.`,
    `${Math.abs(wD!).toFixed(1)} kg below your recent average, ${firstName}. The trend is pointing in the right direction.`,
    `Weight is moving, ${firstName}. ${Math.abs(wD!).toFixed(1)} kg down from your recent average — keep doing what you're doing.`,
    `${firstName}, you're ${Math.abs(wD!).toFixed(1)} kg lighter than your recent average. The work is showing up in the numbers.`,
  ], seed)

  if (fDown) return pick([
    `Body fat is trending down — that's ${Math.abs(fD!).toFixed(1)}% off your recent average, ${firstName}. The diet is working.`,
    `Fat percentage dropping, ${firstName}. ${Math.abs(fD!).toFixed(1)}% off the recent average — that's real progress.`,
    `${Math.abs(fD!).toFixed(1)}% off your recent body fat average, ${firstName}. The changes are making a difference.`,
    `Fat is falling, ${firstName}. Down ${Math.abs(fD!).toFixed(1)}% from your recent average. That's your effort showing up in the data.`,
    `${firstName}, body fat is ${Math.abs(fD!).toFixed(1)}% below your recent average. Quiet progress is still progress.`,
  ], seed)

  if (mUp) return pick([
    `Muscle is up ${mD!.toFixed(1)} kg from your recent average. The work is paying off, ${firstName}.`,
    `${mD!.toFixed(1)} kg of muscle gained versus your recent average. Strength is building, ${firstName}.`,
    `${firstName}, muscle is up ${mD!.toFixed(1)} kg from your recent baseline. You can't see it in a mirror yet, but the scale knows.`,
    `${mD!.toFixed(1)} kg more muscle than your recent average, ${firstName}. The resistance training is doing exactly what it should.`,
    `Muscle is climbing, ${firstName}. Up ${mD!.toFixed(1)} kg from your recent average. That's real tissue — not a fluctuation.`,
  ], seed)

  if (wUp && mUp) return pick([
    `Weight is up ${wD!.toFixed(1)} kg but muscle is up too — could be a good kind of gain, ${firstName}.`,
    `Gaining weight but also gaining muscle, ${firstName}. Worth watching which way the fat goes next.`,
    `${firstName}, weight is up ${wD!.toFixed(1)} kg — but muscle is up with it. This might be the good kind of gain.`,
    `Scale went up ${wD!.toFixed(1)} kg, ${firstName}, but so did your muscle. Don't panic on weight alone — watch the whole picture.`,
    `Weight up, muscle up, ${firstName}. Not all weight gain is created equal. Keep an eye on the fat number next time.`,
  ], seed)

  if (wUp && fUp) return pick([
    `Weight and fat are up a bit compared to your recent average, ${firstName}. Happens to everyone — small corrections add up fast.`,
    `Numbers moved up a bit lately, ${firstName}. Nothing you can't turn around with a bit of focus this week.`,
    `${firstName}, weight and fat are both nudging up from your recent average. It's a signal, not a crisis. Small adjustments, consistent effort.`,
    `A bit of a setback on weight and fat, ${firstName}. It happens. The question is what you do in the next few days — and this dashboard will show the answer.`,
    `Weight and fat both ticked up, ${firstName}. Not the reading you wanted — but you showed up, you measured, and now you know. That's half the battle.`,
  ], seed)

  if (wUp || fUp || mDown) return pick([
    `Things shifted a little in the last measurement, ${firstName}. Progress isn't linear — the trend over time is what matters.`,
    `A small step back, ${firstName}. It's data, not a verdict — what you do next is what counts.`,
    `The numbers moved the wrong way slightly, ${firstName}. That's normal. Bodies aren't machines. The trend over time is the only number that matters.`,
    `One measurement against the grain, ${firstName}. Zoom out — it's the pattern across weeks and months that tells the real story.`,
    `${firstName}, this one went the wrong way a little. Don't let a single data point write the narrative. Keep showing up.`,
  ], seed)

  // Neutral / steady
  const waterOk = waterCategory(latest.water_pct, gender)
  if (waterOk === 'low') {
    return pick([
      `Body water is on the low side, ${firstName}. Consistent hydration also shows up in your other metrics — worth paying attention to.`,
      `Hydration is looking a bit low, ${firstName}. Body water percentage affects how muscle and fat readings come out — drink up.`,
      `${firstName}, body water is lower than ideal. It's one of those things that affects everything else — energy, readings, recovery. Drink more.`,
      `Water percentage is a bit low, ${firstName}. Dehydration can make your other metrics look worse than they are — worth sorting before your next measurement.`,
      `${firstName}, hydration is on the low end. This affects your readings more than people realise — muscle and fat numbers shift with water levels. Stay on top of it.`,
    ], seed)
  }

  return pick([
    `Holding steady, ${firstName}. Consistency is the whole game.`,
    `Numbers are stable, ${firstName}. Stable is good — it means you're maintaining what you've built.`,
    `All metrics holding, ${firstName}. Keep measuring and the trends will tell the story over time.`,
    `Steady as it goes, ${firstName}. Maintenance is underrated — it means the work you did is sticking.`,
    `${firstName}, everything's holding. Stability isn't nothing — it's proof the habits are working.`,
    `No big moves in the numbers, ${firstName}. Sometimes that's exactly what you want — consistency doing its job quietly.`,
  ], seed)
}
