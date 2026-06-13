import type { Measurement, GoalMap, Profile } from './types'
import { fatCategory, fatDistribution, visceralCategory, waterCategory, genderNoun, isFatImproving, bmiCategory } from './references'

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

  // ── No data ──────────────────────────────────────────────────────────────────
  if (measurements.length === 0) {
    return pick([
      `No measurements yet, ${firstName}. Drop your TANITA folder below and we'll get started.`,
      `Ready when you are, ${firstName}. Import your TANITA data and this dashboard comes alive.`,
      `Nothing here yet, ${firstName}. Add your first measurement and your health story begins.`,
      `Waiting on your data, ${firstName}. Drop that TANITA folder and let's see what you've got.`,
      `Blank slate, ${firstName}. Everything starts with measurement one — whenever you're ready.`,
      `The dashboard is ready, ${firstName}. All it needs is your first measurement.`,
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
      `Visceral fat is the number I'd focus on right now, ${firstName}. It's above the healthy range — but it's also the most responsive metric to lifestyle change. Cardio first, diet second.`,
      `The fat that sits around the organs is elevated, ${firstName}. That's the one that matters most for long-term health — and fortunately it's also the first to go when you commit to consistent cardio.`,
      `Visceral fat is in the red zone, ${firstName}. The good news: this responds to cardio faster than any other fat type. A few consistent weeks makes a real difference here.`,
      `${firstName}, visceral fat is above the safe range. Not a verdict — but a clear priority. Cutting refined carbs and adding steady cardio are the fastest tools you have.`,
      `High visceral fat changes every other number on this page, ${firstName}. Bring it down and the rest tends to follow. Start with cardio; it shifts this more than diet alone.`,
      `Your body is carrying more deep fat than is healthy right now, ${firstName}. The body is remarkably good at clearing this with sustained effort. The moment you start moving consistently, it begins to go.`,
      `Visceral fat is elevated, ${firstName}. It's not the kind you see — it's the kind wrapped around the organs. That makes it the most important one to address. Cardio is your best lever.`,
    ], seed)
  }

  // ── Priority 2: Goal milestones ──────────────────────────────────────────────
  const goalMessages: string[] = []

  if (goals.weight_kg != null && latest.weight_kg != null) {
    const diff = latest.weight_kg - goals.weight_kg
    if (Math.abs(diff) <= 0.3) {
      goalMessages.push(`You hit your weight goal, ${firstName}. That's real work. Time to set the next target.`)
      goalMessages.push(`${firstName}, you said you'd get there and you did. Weight goal: done.`)
      goalMessages.push(`There it is, ${firstName}. You said you'd do it and you did it. Set a new one before the momentum cools.`)
      goalMessages.push(`Weight goal reached, ${firstName}. Take a moment — then raise the bar.`)
      goalMessages.push(`${firstName}, you're at your target weight. That's not luck, that's consistency paying off.`)
      goalMessages.push(`Goal weight hit, ${firstName}. The version of you who set that target is very pleased right now.`)
      goalMessages.push(`You did it, ${firstName}. Weight goal done. Don't let the milestone become the finish line — set a new one.`)
      goalMessages.push(`${firstName}, the weight goal is checked. Some people set goals. Some people reach them. You just did both.`)
    } else if (diff > 0 && diff <= goals.weight_kg * 0.04) {
      goalMessages.push(`Just a little way to go on weight. You're in the home stretch, ${firstName}.`)
      goalMessages.push(`${firstName}, weight goal is almost in reach. This close, the discipline that got you here finishes it.`)
      goalMessages.push(`So close on weight, ${firstName}. Don't change a thing — just keep doing what brought you here.`)
      goalMessages.push(`The finish line is right there on weight, ${firstName}. Don't rush it. Let the process do the work.`)
      goalMessages.push(`Weight goal nearly in reach, ${firstName}. You've done the hard part — these last steps are patience.`)
      goalMessages.push(`Almost there, ${firstName}. Weight is nearly at your target. Don't second-guess yourself now.`)
      goalMessages.push(`${firstName}, you're this close to your weight goal. Consistency isn't exciting, but it's what closes the gap.`)
    }
  }

  if (goals.fat_total_pct != null && latest.fat_total_pct != null) {
    const diff = latest.fat_total_pct - goals.fat_total_pct
    if (Math.abs(diff) <= 0.3) {
      goalMessages.push(`Body fat goal achieved — you're right on target, ${firstName}. Nicely done.`)
      goalMessages.push(`You're at your body fat goal, ${firstName}. Exactly where you aimed.`)
      goalMessages.push(`${firstName}, you said that number and you hit it. That's the whole deal.`)
      goalMessages.push(`Fat goal checked, ${firstName}. You aimed and you got there. Now raise the bar.`)
      goalMessages.push(`${firstName}, you said you'd get to that body fat number. Here you are. Not a coincidence — that's sustained effort.`)
      goalMessages.push(`Body fat goal achieved, ${firstName}. Celebrate it — then figure out what the next version of you looks like.`)
      goalMessages.push(`${firstName}, body fat goal done. The number on the screen is proof that the habits were real.`)
    } else if (diff > 0 && diff <= 1.5) {
      goalMessages.push(`Almost there on body fat, ${firstName}. The finish line is in sight.`)
      goalMessages.push(`${firstName}, you're very close to your fat goal. The hardest part is behind you.`)
      goalMessages.push(`Just a sliver between you and your body fat goal, ${firstName}. Keep doing what's been working.`)
      goalMessages.push(`So close on body fat, ${firstName}. Don't rush it — you're doing exactly the right things.`)
      goalMessages.push(`Body fat nearly at your target, ${firstName}. You've earned this. Finish it.`)
      goalMessages.push(`${firstName}, your fat goal is within reach. Keep the habits — the number will follow.`)
      goalMessages.push(`Almost at your body fat target, ${firstName}. The gap is small. Your consistency got you here.`)
    }
  }

  if (goals.muscle_total_kg != null && latest.muscle_total_kg != null) {
    const diff = latest.muscle_total_kg - goals.muscle_total_kg
    if (diff >= 0) {
      goalMessages.push(`Muscle goal cleared, ${firstName}. Time to raise the bar.`)
      goalMessages.push(`You've passed your muscle goal, ${firstName}. Set a new one so you have something to chase.`)
      goalMessages.push(`Muscle goal hit, ${firstName}. Every rep built this. Now build more.`)
      goalMessages.push(`${firstName}, your muscle is past your goal. The work is real. Don't let the target become a ceiling.`)
      goalMessages.push(`You cleared your muscle target, ${firstName}. The body didn't do that on its own — you did. Set a harder one.`)
      goalMessages.push(`Muscle goal achieved, ${firstName}. The person who wrote that goal didn't know how strong you'd get.`)
      goalMessages.push(`${firstName}, muscle goal done. Now the real question is: what's the next number?`)
    } else if (Math.abs(diff) <= 1.5) {
      goalMessages.push(`So close on muscle, ${firstName}. Keep the resistance training consistent.`)
      goalMessages.push(`${firstName}, you're very close to your muscle goal. The training is working — stay patient.`)
      goalMessages.push(`Almost at your muscle target, ${firstName}. Keep loading the bar.`)
      goalMessages.push(`You're this close on muscle, ${firstName}. Don't stop now.`)
      goalMessages.push(`Muscle goal nearly in reach, ${firstName}. The body builds at its own pace — trust the process.`)
      goalMessages.push(`Just a bit to go on muscle, ${firstName}. This is where consistency beats intensity.`)
      goalMessages.push(`${firstName}, nearly at your muscle goal. The work is in there — the body is just catching up.`)
    }
  }

  // Resting calorie goal
  if (goals.resting_calories != null && latest.resting_calories != null) {
    const diff = latest.resting_calories - goals.resting_calories
    if (Math.abs(diff) <= 50) {
      goalMessages.push(`Your resting calorie burn is right at your target, ${firstName}. That's your metabolism running at the rate you worked toward. Muscle mass got you here.`)
      goalMessages.push(`Resting calorie goal reached, ${firstName}. A higher resting burn means your body works harder even when you're not. That's what building muscle does.`)
      goalMessages.push(`${firstName}, your metabolic rate hit your target. That's not a small thing — resting calorie burn is one of the hardest numbers to move upward. You moved it.`)
    } else if (diff < 0 && Math.abs(diff) <= 150) {
      goalMessages.push(`Your resting calorie burn is getting close to your target, ${firstName}. Building muscle is what gets you the rest of the way — every rep adds to your resting metabolic rate.`)
      goalMessages.push(`${firstName}, resting calorie burn is closing in on your target. Muscle is the engine — keep the resistance training up and this number will follow.`)
      goalMessages.push(`Almost at your resting calorie goal, ${firstName}. You're close to the metabolic rate you were aiming for. Keep building muscle and it'll get there.`)
    }
  }

  // Water percentage goal
  if (goals.water_pct != null && latest.water_pct != null) {
    const diff = latest.water_pct - goals.water_pct
    if (Math.abs(diff) <= 1) {
      goalMessages.push(`Body water is right at your hydration target, ${firstName}. Well hydrated means more accurate readings across the board — and better energy, better recovery, better everything.`)
      goalMessages.push(`${firstName}, you've hit your hydration goal. Body water at that level is the quiet foundation that makes all your other numbers more reliable.`)
      goalMessages.push(`Hydration target reached, ${firstName}. Water percentage affects every other metric on this page — and yours is exactly where you wanted it.`)
    } else if (diff < 0 && Math.abs(diff) <= 3) {
      goalMessages.push(`Body water is nearly at your target, ${firstName}. You're close — consistent hydration through the day gets you the rest of the way.`)
      goalMessages.push(`${firstName}, hydration is almost at your goal. It's one of the faster metrics to improve once you make it a daily habit.`)
    }
  }

  // Visceral fat goal
  if (goals.visceral_fat != null && latest.visceral_fat != null) {
    const diff = latest.visceral_fat - goals.visceral_fat
    if (diff <= 0) {
      goalMessages.push(`Visceral fat is at or below your target, ${firstName}. That's the most important internal health marker you could have moved. Serious work.`)
      goalMessages.push(`${firstName}, you hit your visceral fat goal. That's the fat most directly linked to long-term disease risk — and you brought it down. That matters.`)
      goalMessages.push(`Visceral fat goal done, ${firstName}. The organs are better protected, the metabolic risk is lower, and you did the work that made it happen.`)
    } else if (diff <= 3) {
      goalMessages.push(`Visceral fat is just ${Math.round(diff)} level${diff === 1 ? '' : 's'} from your target, ${firstName}. The cardio is working — you're almost there.`)
      goalMessages.push(`${firstName}, so close on visceral fat. Just a little further and you'll hit a number that has real consequences for your long-term health.`)
      goalMessages.push(`Nearly at your visceral fat goal, ${firstName}. Don't stop — this is the metric that matters most for internal health and you're right at the finish line.`)
    }
  }

  if (goalMessages.length > 0) {
    return pick(goalMessages, seed)
  }

  // ── Priority 2.5: Measurement milestones ─────────────────────────────────────
  if (measurements.length === 10) {
    return pick([
      `Ten measurements in, ${firstName}. You've officially been doing this long enough for the trends to start meaning something.`,
      `${firstName}, you've hit ten check-ins. That's the point where this stops being a snapshot and starts being a story.`,
      `Measurement ten, ${firstName}. Most people give up before this. You didn't. The data from here gets interesting.`,
      `Ten measurements and counting, ${firstName}. You're building a picture of your body that most people never have.`,
      `${firstName}, ten check-ins in. At this point the trends are real — not just noise. Keep going.`,
    ], seed)
  }

  if (measurements.length === 25) {
    return pick([
      `Twenty-five measurements, ${firstName}. You're a consistent measurer — that's rare. The trends here are actually telling you something real.`,
      `${firstName}, 25 check-ins. You've earned a proper view of your health over time. Not many people have this.`,
      `A quarter-century of check-ins, ${firstName}. The body doesn't lie over this many measurements. Trust what the trends are showing.`,
      `25 measurements in, ${firstName}. You've built one of the most useful things there is: a real record of your body over time.`,
      `${firstName}, 25 check-ins. That's not a streak — that's a practice. The value compounds.`,
    ], seed)
  }

  if (measurements.length === 50) {
    return pick([
      `Fifty measurements, ${firstName}. That's commitment. The trend across this much data is more valuable than any single reading.`,
      `${firstName}, 50 check-ins. At this point you probably know your body's patterns better than most people know themselves.`,
      `Half a century of measurements, ${firstName}. The health picture you have is genuinely rare. Use it.`,
      `50 check-ins, ${firstName}. That's not a habit — that's a practice. The compound interest of consistent measurement shows up in data like this.`,
      `${firstName}, 50 measurements. You've been showing up for yourself, consistently, for a long time. That matters.`,
    ], seed)
  }

  if (measurements.length === 100) {
    return pick([
      `One hundred measurements, ${firstName}. You have a more detailed picture of your health than most people will ever have. That's extraordinary.`,
      `${firstName}, a hundred check-ins. Whatever this data has taught you, it's taught you more than you'd ever learn without measuring. Keep going.`,
      `A hundred measurements in, ${firstName}. You've turned self-knowledge into a practice. That's rare.`,
      `${firstName}, 100. Not many people get here. The ones who do know things about their bodies that no doctor visit could tell them.`,
    ], seed)
  }

  // ── Priority 3: Metabolic age ─────────────────────────────────────────────────
  if (latest.metabolic_age != null && latest.age != null) {
    const metaDiff = latest.age - latest.metabolic_age  // positive = metabolically younger
    if (metaDiff >= 5) {
      return pick([
        `Your metabolism is running about ${metaDiff} years younger than your actual age, ${firstName}. Whatever you're doing, it's working.`,
        `${firstName}, your body is performing well ahead of your age on the inside. That's a direct result of the habits you've built.`,
        `Metabolically speaking, your body is significantly younger than the calendar says, ${firstName}. That doesn't happen by accident.`,
        `Your metabolic age is meaningfully below your actual age, ${firstName}. This is the number that actually predicts long-term health — and yours is heading in the right direction.`,
        `${firstName}, your metabolism is acting younger than you are. By a real margin. The body is reflecting your effort.`,
        `A younger metabolism than your years, ${firstName}. That's the kind of thing you earn with consistent training and diet — and you've earned it.`,
        `${firstName}, the inside of your body is running younger than your age suggests. That's not a small thing. That's what years of showing up looks like.`,
        `Your metabolic age says you're running younger than your years, ${firstName}. That gap between calendar age and body age is one of the most meaningful markers of long-term health.`,
      ], seed)
    }
    if (metaDiff <= -5) {
      return pick([
        `Your metabolism is running a bit older than your actual age, ${firstName}. This is reversible — sustained cardio and building muscle are the fastest ways to close the gap.`,
        `${firstName}, metabolically your body is running a little ahead of your years — and not in a good way. The good news: this responds well to training. Muscle work has the biggest single effect.`,
        `Your metabolic age is slightly above your actual age, ${firstName}. That gap is exactly what this dashboard can help close. Building muscle is the biggest lever.`,
        `${firstName}, your body is running a little older metabolically than it should be. Fixable — and one of the metrics that responds most quickly to consistent effort.`,
        `Metabolic age is a bit above your calendar age, ${firstName}. Not a huge gap, but one worth closing. Resistance training is the fastest route there.`,
        `${firstName}, there's a gap between how old you are and how old your metabolism thinks you are. Building muscle narrows it faster than anything else.`,
      ], seed)
    }
  }

  // ── Priority 4: Multiple goals set — progress messages ───────────────────────
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
        `You set goals and you're hitting them, ${firstName} — ${movingTowardGoals.join(' and ')}. That's not a coincidence.`,
        `${firstName}, quiet progress happening. ${movingTowardGoals.join(' and ')}. Goals are getting closer.`,
        `Goals in sight, ${firstName}. ${movingTowardGoals.join(' and ')}. The direction is right and the pace is working.`,
      ], seed)
    }
  }

  // ── Priority 5: Body fat vs gender/age reference ─────────────────────────────
  const fatCat = fatCategory(latest.fat_total_pct, gender, latest.age, ethnicity)

  const fatImproving = prev3.length > 0
    ? isFatImproving(latest.fat_total_pct, prev3[prev3.length - 1].fat_total_pct, gender, latest.age, ethnicity)
    : false

  if (fatCat === 'excellent') {
    return pick([
      `Your body fat is in the excellent range for ${gNoun} your age, ${firstName}. That's a strong foundation — keep it there.`,
      `Excellent body fat for your profile, ${firstName}. You're ahead of the average ${gNoun} in your age group.`,
      `${firstName}, your body composition is genuinely excellent for your age. Whatever your routine is — it's working.`,
      `Excellent category on body fat, ${firstName}. Most people never get here. You did the work.`,
      `You're in the excellent range for body fat, ${firstName}. That's not where most ${gNoun} your age land. It's worth protecting.`,
      `Body fat in the excellent zone, ${firstName}. That's a meaningful place to be — and something to defend.`,
      `${firstName}, excellent body fat for your age and profile. This is where you want to be. Now keep it here.`,
      `Sitting in the excellent range on body fat, ${firstName}. That's the category people spend years working toward. You're in it.`,
      `Excellent body composition for ${gNoun} your age, ${firstName}. The habits that got you here are the habits that keep you here.`,
      `${firstName}, body fat in the excellent range means you're not just healthy — you're ahead of most ${gNoun} your age. That's earned.`,
    ], seed)
  }

  if (fatCat === 'good') {
    if (fatImproving) {
      return pick([
        `Your body fat is in the good range and still improving, ${firstName}. Excellent category is within reach.`,
        `You're in the good range on body fat and the trend is pointing the right way, ${firstName}.`,
        `Good range and trending better, ${firstName}. That's not a plateau — that's progress still happening.`,
        `Body fat: good range, heading toward excellent, ${firstName}. Stay the course.`,
        `The trajectory is right, ${firstName}. Good body fat today, excellent if you keep this up.`,
        `${firstName}, you're already in the good range — and still improving. Don't stop.`,
        `Good and getting better, ${firstName}. Excellent range is your next stop if the trend holds.`,
        `${firstName}, good body fat with a better-than-average trajectory. The work is compounding.`,
      ], seed)
    }
    return pick([
      `Body fat is in the good range for ${gNoun} your age, ${firstName}. Solid.`,
      `You're doing well on body composition, ${firstName} — good range for your age and profile.`,
      `Good body fat range, ${firstName}. You're in solid shape for ${gNoun} your age.`,
      `${firstName}, your body fat puts you in the good category. That's where most people are working hard just to reach.`,
      `Sitting in the good range on body fat, ${firstName}. Not just average — genuinely good.`,
      `Good body composition, ${firstName}. Real category — not just "not bad". You're doing well.`,
      `${firstName}, good category on body fat. Most people would be very happy with this number.`,
      `Solid body fat percentage, ${firstName}. Good range for someone your age. This is worth maintaining.`,
      `${firstName}, body fat in the good range. That takes work to get to and work to stay at. You're doing both.`,
    ], seed)
  }

  if (fatCat === 'high') {
    if (fatImproving) {
      return pick([
        `Body fat is still above the average for ${gNoun} your age, but it's heading the right way, ${firstName}. Keep the momentum.`,
        `The trend is good, ${firstName} — fat is coming down even if there's still ground to cover.`,
        `You're above range on body fat but moving toward it, ${firstName}. That direction is everything.`,
        `It's going down, ${firstName}. Body fat is still above the reference for ${gNoun} your age, but the needle is moving the right way.`,
        `Progress is real, ${firstName}. Body fat is dropping — it's not in range yet, but you're getting there.`,
        `${firstName}, the fat is dropping — that's the signal that matters right now. The range is coming.`,
        `Still above range, but heading toward it, ${firstName}. Movement in the right direction is the whole game.`,
        `${firstName}, body fat is above average for your profile but tracking down. That direction is more important than the number.`,
      ], seed)
    }
    return pick([
      `Body fat is above the reference range for ${gNoun} your age, ${firstName}. Small, consistent changes in diet and training move this more than anything.`,
      `There's room to lower body fat below the average for ${gNoun} your age, ${firstName}. The data gives you a clear direction.`,
      `${firstName}, body fat is above the reference range. The good news: this is very responsive to lifestyle changes. Cardio and diet will move it.`,
      `Above the reference range on body fat, ${firstName}. Not a verdict — just a direction. And now you know which way to point.`,
      `${firstName}, body fat is above where the research puts healthy for your profile. That's useful information — not discouragement. This is what you're working toward.`,
      `Fat is above range, ${firstName}. That's what this dashboard is for — giving you a clear direction. Cardio and diet are both tools here. Both matter.`,
      `Above the reference range on body fat, ${firstName}. The body got here slowly and it'll come down slowly. Consistency beats intensity.`,
      `${firstName}, body fat above range is a clear signal — but it's also the kind of signal your body knows how to respond to, given the right input. Diet and movement, consistently.`,
    ], seed)
  }

  // ── Priority 5.5: BMI reference ──────────────────────────────────────────────
  if (fatCat == null || fatCat === 'average') {
    const bmiCat = bmiCategory(latest.bmi, ethnicity)
    if (bmiCat === 'overweight') {
      return pick([
        `BMI is slightly above the healthy range for your reference group, ${firstName}. Body fat and trends here give you a more complete picture than BMI alone.`,
        `BMI reads as overweight for your reference group, ${firstName}. It's one signal — watch the body fat trend alongside it.`,
        `BMI is nudging above the healthy range, ${firstName}. On its own, BMI is a blunt instrument — but it's worth keeping an eye on.`,
        `${firstName}, BMI is slightly elevated for your reference group. It's not the whole story, but it's worth factoring in.`,
        `Your BMI puts you just into overweight for your reference group, ${firstName}. Body fat percentage here tells you more about what's actually going on.`,
        `Slightly elevated BMI for your reference group, ${firstName}. Worth being aware of — but don't read too much into BMI alone. The full picture is in the other numbers.`,
        `${firstName}, BMI is nudging above the healthy zone for your profile. One number, not a complete picture — but a useful prompt to look at the rest of the data here.`,
      ], seed)
    }
    if (bmiCat === 'obese') {
      return pick([
        `BMI is above the healthy range for your reference group, ${firstName}. Combined with the body fat data here, you have a clear direction to work from.`,
        `BMI puts you above the recommended range for your reference group, ${firstName}. Small, consistent changes in diet and movement move this faster than you'd expect.`,
        `${firstName}, BMI is in the high range for your reference group. That's hard to read, but you're already measuring — that's the first real step.`,
        `Your BMI is above where we'd want it, ${firstName}. The people who improve from here are the ones who keep showing up and measuring. You're here.`,
        `Above the healthy BMI range, ${firstName}. Not a life sentence — just a current position. The compound effect of small daily choices changes this.`,
        `High BMI for your reference group, ${firstName}. It's data — and data you can act on. Every measurement from here is part of the story.`,
        `${firstName}, the BMI is elevated for your profile. It's a blunt metric, but it's pointing at something real. Use the body fat and trends here to get a sharper picture of where to focus.`,
      ], seed)
    }
  }

  // ── Priority 6: Visceral fat elevated ────────────────────────────────────────
  if (viscat === 'elevated') {
    return pick([
      `Visceral fat is slightly above the healthy range, ${firstName}. Still very manageable with consistent cardio and diet tweaks.`,
      `Visceral fat is a touch elevated, ${firstName}. Not alarming — but worth bringing down. Cardio is your best tool here.`,
      `${firstName}, visceral fat is slightly elevated. The healthy range is close — cardio and cutting back on processed foods will close the gap.`,
      `Visceral fat is a little high, ${firstName}. This kind responds well to steady cardio — even 30 minutes a few times a week makes a real difference.`,
      `Just above the healthy range on visceral fat, ${firstName}. Straightforward to address: more cardio, fewer processed foods. Your body will respond.`,
      `${firstName}, visceral fat is nudging above the healthy zone. Worth being intentional about — this fat type responds faster to cardio than it does to diet.`,
      `Slightly elevated visceral fat, ${firstName}. Not a crisis — but a clear signal. Sustained cardio is the most effective thing you can do here.`,
      `${firstName}, visceral fat is above the line but close to it. The gap to healthy range is narrow. A few weeks of consistent cardio will bring it back.`,
    ], seed)
  }

  // ── Priority 7: First data point ─────────────────────────────────────────────
  if (prev3.length === 0) {
    return pick([
      `First data point is in, ${firstName}. This is your baseline — every measurement from here tells a story.`,
      `Your baseline is set, ${firstName}. Add measurements consistently and the trends will tell you everything.`,
      `There's your starting line, ${firstName}. The first number is always the most important — it's where everything gets measured from.`,
      `Data point one is locked in, ${firstName}. Come back after your next measurement and we'll start seeing the story.`,
      `${firstName}, your baseline is here. Some people never start — you did. That counts for more than the numbers right now.`,
      `Starting line set, ${firstName}. Come back and measure again, and this place starts to come alive.`,
      `${firstName}, this is where the story starts. Measurement one is the most important one — because without it, nothing else has context.`,
      `One measurement in, ${firstName}. The number is just a number right now. The next one is where it starts to mean something.`,
    ], seed)
  }

  // ── Priority 7.5: Long gap since last measurement ────────────────────────────
  const daysSincePrev = (
    new Date(latest.measured_at).getTime() - new Date(prev3[prev3.length - 1].measured_at).getTime()
  ) / (1000 * 60 * 60 * 24)

  if (daysSincePrev > 45) {
    return pick([
      `Good to see you back, ${firstName}. It's been a while — the data from here will start filling in the picture again.`,
      `${firstName}, welcome back. The gap since your last measurement is a long one, but that's fine. What matters is showing up again.`,
      `A longer stretch between measurements this time, ${firstName}. No judgment — bodies and schedules happen. The important thing is you're here now.`,
      `It's been a while, ${firstName}. The baseline might have shifted — use this as your new starting point and go from here.`,
      `Back at it, ${firstName}. Gaps happen to everyone. The consistency from here is what counts.`,
      `${firstName}, long gap but you're back. The only measurement that matters less than no measurement is a perfect streak you abandon. Showing up again is the move.`,
      `Welcome back, ${firstName}. Pick up where you left off — or start fresh. Either way, you're measuring again. That's what matters.`,
    ], seed)
  }

  // ── Priority 8: Trend-based ───────────────────────────────────────────────────
  const avg2 = (field: keyof Measurement) => {
    const vals = prev3.map(m => m[field] as number | null).filter((v): v is number => v != null)
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }
  const wD = avg2('weight_kg') != null && latest.weight_kg != null ? latest.weight_kg - avg2('weight_kg')! : null
  const fD = avg2('fat_total_pct') != null && latest.fat_total_pct != null ? latest.fat_total_pct - avg2('fat_total_pct')! : null
  const mD = avg2('muscle_total_kg') != null && latest.muscle_total_kg != null ? latest.muscle_total_kg - avg2('muscle_total_kg')! : null
  const rcD = avg2('resting_calories') != null && latest.resting_calories != null ? latest.resting_calories - avg2('resting_calories')! : null

  const wDown = wD != null && wD < -0.2
  const wUp = wD != null && wD > 0.2
  const fDown = fD != null && fD < -0.3
  const fUp = fD != null && fD > 0.3
  const mUp = mD != null && mD > 0.1
  const mDown = mD != null && mD < -0.1
  const rcUp = rcD != null && rcD > 50

  if (wDown && fDown && mUp) return pick([
    `Everything's moving in the right direction, ${firstName} — weight down, fat down, muscle up.`,
    `The triple: weight down, fat down, muscle up. That's exactly the direction you want, ${firstName}.`,
    `Weight, fat, muscle — all moving the right way, ${firstName}. Whatever you're doing, keep it going.`,
    `${firstName}, this is the ideal measurement. Weight down, fat down, muscle up. Don't overthink it — just keep going.`,
    `Three for three, ${firstName}. Weight down, fat down, muscle up. This is what the work looks like when it pays off.`,
    `That's the one, ${firstName}. Weight down, fat dropping, muscle climbing. Screenshot this one.`,
    `Everything aligned, ${firstName}. Weight, fat, muscle all going the right way at once. That's rare. Don't change a thing.`,
    `${firstName}, these three numbers don't all go the right way by accident. This is what consistent, smart effort looks like.`,
    `Weight lighter, fat lower, muscle higher, ${firstName}. All three, at the same time. Keep this up.`,
  ], seed)

  if (wDown && mUp) return pick([
    `Losing weight while gaining muscle is genuinely hard to pull off. You're doing it, ${firstName}.`,
    `${firstName}, lighter and stronger at the same time. That's the body composition shift everyone's chasing.`,
    `Weight is falling, muscle is climbing, ${firstName}. That's a recomposition happening in real time.`,
    `Down in weight, up in muscle — ${firstName}, the combination that matters is exactly what's happening.`,
    `Weight going down while muscle goes up, ${firstName}. Most people only get one or the other. You're getting both.`,
    `${firstName}, you're losing fat and building muscle simultaneously. That's not easy. Whatever you're doing — don't touch it.`,
    `Lighter and with more muscle, ${firstName}. The scale doesn't always tell that story clearly — but your body composition does.`,
  ], seed)

  if (fDown && mUp) return pick([
    `Fat is dropping and muscle is building — your composition is shifting in the best possible direction, ${firstName}.`,
    `Body recomposition in progress, ${firstName}. Fat down, muscle up — that's the goal right there.`,
    `${firstName}, fat is falling and muscle is rising. That's a real change, not a fluctuation.`,
    `The composition is shifting, ${firstName}. Less fat, more muscle. This is what the process looks like.`,
    `Fat down, muscle up — ${firstName}, the scale might not always show this, but your body is genuinely changing.`,
    `Less fat, more muscle, ${firstName}. The internal picture is improving. The work is showing.`,
    `${firstName}, fat and muscle going in opposite directions — exactly the right ones. That's a meaningful change.`,
    `Your composition is improving, ${firstName}. Fat dropping, muscle climbing. The body is reorganising itself in the right direction.`,
  ], seed)

  if (wDown) return pick([
    `Weight is trending down, ${firstName}. On track.`,
    `Weight is moving the right way, ${firstName}. Down from your recent average — keep doing what you're doing.`,
    `${firstName}, you're lighter than your recent average. The work is showing up.`,
    `Weight heading in the right direction, ${firstName}. Let it keep going.`,
    `Down in weight compared to your recent trend, ${firstName}. Small, consistent movement is exactly this.`,
    `${firstName}, weight is dropping. Quietly, steadily — which is exactly how it should happen.`,
    `The scale is cooperating, ${firstName}. Weight down from your recent average. Trust the process.`,
    `Weight trending down, ${firstName}. Don't overthink a good trend. Just keep going.`,
    `${firstName}, lighter than your recent average. That's not magic — that's your habits doing their job.`,
  ], seed)

  if (fDown) return pick([
    `Body fat is trending down, ${firstName}. The diet is working.`,
    `Fat percentage dropping, ${firstName}. That's real progress — it moves slowly and then suddenly.`,
    `Fat is falling, ${firstName}. Down from your recent average. Your effort is making a difference.`,
    `${firstName}, body fat is below your recent average. Quiet progress is still progress.`,
    `Body fat dropping, ${firstName}. That's the direction. Keep it.`,
    `${firstName}, fat is heading down. The habits are working — sometimes it just takes a while to show up in the numbers.`,
    `Fat percentage on the way down, ${firstName}. Less fat stored means more energy available. The body is reorganising.`,
    `Down on body fat from your recent trend, ${firstName}. Fat loss is rarely linear, but the direction is clear.`,
    `${firstName}, body fat is falling. Not dramatically — but steadily. That's the right kind of change.`,
  ], seed)

  if (mUp) return pick([
    `Muscle is up from your recent average, ${firstName}. The work is paying off.`,
    `${firstName}, muscle is growing. The resistance training is doing exactly what it should.`,
    `More muscle than your recent baseline, ${firstName}. You can't always see it in a mirror, but the scale knows.`,
    `Muscle is climbing, ${firstName}. That's real tissue — not a fluctuation.`,
    `${firstName}, muscle is up. Every set you've done this cycle is showing up right here.`,
    `Strength is building, ${firstName}. Muscle is up from your recent average. The body is responding.`,
    `${firstName}, muscle up from your recent trend. This is one of the slowest metrics to move — which makes it all the more real when it does.`,
    `More muscle than a few measurements ago, ${firstName}. Building this takes patience. You have it.`,
    `${firstName}, muscle gaining. The resistance is working. The body is adapting. Keep going.`,
  ], seed)

  if (rcUp) return pick([
    `Your body is burning more calories at rest than it was recently, ${firstName}. That's your metabolism running hotter — usually a sign that muscle is doing its job.`,
    `${firstName}, your resting calorie burn is up from recent measurements. More muscle means a higher engine — and yours is getting more powerful.`,
    `Your metabolism is up, ${firstName}. Your body is working harder even when you're not. That's usually muscle gains doing their thing quietly.`,
    `Your engine is running faster, ${firstName}. Burning more calories at rest is a quiet sign that your body composition is shifting in the right direction.`,
    `${firstName}, your body is running hotter at rest than it has been recently. That's the kind of change that compounds — more muscle, higher burn, better composition over time.`,
  ], seed)

  if (wUp && mUp) return pick([
    `Weight is up but muscle is up too — this might be the good kind of gain, ${firstName}.`,
    `Gaining weight but also gaining muscle, ${firstName}. Worth watching which way the fat goes next.`,
    `${firstName}, weight is up — but so is your muscle. Don't panic on weight alone. Watch the whole picture.`,
    `Scale went up, ${firstName}, but so did your muscle. Not all weight gain is the same. Keep an eye on the fat number next time.`,
    `Weight up, muscle up, ${firstName}. The weight gain might just be the muscle you've been building. Wait for the next measurement.`,
    `${firstName}, heavier but more muscular. If the fat stayed stable, this is the right kind of weight gain.`,
  ], seed)

  if (wUp && fUp) return pick([
    `Weight and fat are up a bit compared to your recent average, ${firstName}. Happens to everyone — small corrections add up fast.`,
    `Numbers moved up a bit lately, ${firstName}. Nothing you can't turn around with a bit of focus this week.`,
    `${firstName}, weight and fat are both nudging up from your recent average. It's a signal, not a crisis. Small adjustments, consistent effort.`,
    `A bit of a setback on weight and fat, ${firstName}. It happens. The question is what you do in the next few days.`,
    `Weight and fat both ticked up, ${firstName}. Not the reading you wanted — but you showed up, you measured, and now you know. That's half the battle.`,
    `${firstName}, the numbers went the wrong way this time. They do that sometimes. The people who improve are the ones who don't let one reading define the story.`,
    `A step back on weight and fat, ${firstName}. Single measurements in the wrong direction are noise — it's what you do about them that becomes signal.`,
    `${firstName}, weight and fat nudged up. Life happens. The fact that you're measuring means you caught it early.`,
  ], seed)

  if (wUp || fUp || mDown) return pick([
    `Things shifted a little in the last measurement, ${firstName}. Progress isn't linear — the trend over time is what matters.`,
    `A small step back, ${firstName}. It's data, not a verdict — what you do next is what counts.`,
    `The numbers moved the wrong way slightly, ${firstName}. That's normal. Bodies aren't machines. The trend over time is the only number that matters.`,
    `One measurement against the grain, ${firstName}. Zoom out — it's the pattern across weeks and months that tells the real story.`,
    `${firstName}, this one went the wrong way a little. Don't let a single data point write the narrative. Keep showing up.`,
    `Slight move in the wrong direction, ${firstName}. Don't overreact. One measurement doesn't make a trend. The next one is more important than this one.`,
    `${firstName}, bodies fluctuate. One reading in the wrong direction isn't a pattern — it's a day. Your response matters more than the number.`,
    `Numbers shifted a bit, ${firstName}. That happens. The people who improve long-term are the ones who don't catastrophise the bad readings or coast on the good ones.`,
  ], seed)

  // ── Priority 8.5: Goals context — what the user is working toward ────────────
  // Fires when goals are set but no progress/milestone condition triggered.
  // Gives informational context about WHY the metric they're chasing matters.
  if (hasGoals) {
    const goalContextMessages: string[] = []

    if (goals.visceral_fat != null && latest.visceral_fat != null && latest.visceral_fat > goals.visceral_fat) {
      goalContextMessages.push(
        `You've set a visceral fat target, ${firstName} — the most consequential goal on this page. Visceral fat wraps around the organs and is the fat most directly linked to diabetes and heart disease risk. Cardio is the fastest lever.`,
        `${firstName}, you're tracking visceral fat. Smart priority — it's the internal fat that matters most for long-term health, and it responds faster to lifestyle change than any other type. Keep the cardio consistent.`,
        `Visceral fat is your target, ${firstName}. It's the type of fat that drives metabolic risk more than any other. The good news: it's also the most responsive. A few weeks of sustained cardio starts to move it.`,
      )
    }

    if (goals.resting_calories != null && latest.resting_calories != null && latest.resting_calories < goals.resting_calories) {
      goalContextMessages.push(
        `You're aiming to raise your resting calorie burn, ${firstName}. That means you're building your metabolism from the inside out. More muscle is the engine — each session of resistance training adds to this number for the long run.`,
        `${firstName}, a resting calorie target is a metabolic goal. The way to get there is muscle — every bit of it raises how much energy your body needs even at complete rest. Resistance training is the investment.`,
        `Tracking resting calorie burn is tracking your engine, ${firstName}. Muscle tissue drives this number up — which is why the resistance training matters even when the scale doesn't budge. You're building your metabolic rate.`,
      )
    }

    if (goals.water_pct != null && latest.water_pct != null && latest.water_pct < goals.water_pct) {
      goalContextMessages.push(
        `You've set a hydration goal, ${firstName} — a good one to track. Body water affects everything else here: a well-hydrated body gives sharper readings on muscle and fat, better recovery, and more consistent energy.`,
        `${firstName}, you're tracking body water. It's the metric that influences all the others — when hydration drops, muscle readings drop with it and fat readings rise. Getting this number right makes everything else more accurate.`,
      )
    }

    if (goals.muscle_total_kg != null && latest.muscle_total_kg != null && latest.muscle_total_kg < goals.muscle_total_kg) {
      goalContextMessages.push(
        `You've got a muscle target, ${firstName}. That's one of the best long-term investments you can make. Muscle raises your resting burn, protects your bone density, and makes everything else — from weight management to energy to resilience — easier as you age.`,
        `${firstName}, you're building toward a muscle goal. Beyond the number on the screen, muscle is what keeps the body functioning well long-term. It raises your metabolism, protects joints, and compounds with every year you maintain it.`,
        `Muscle is your target, ${firstName}. Worth knowing: each kilogram of muscle burns roughly three times as many calories at rest as a kilogram of fat. The goal you're working toward changes your body from the inside out.`,
      )
    }

    if (goals.weight_kg != null && goals.fat_total_pct != null) {
      goalContextMessages.push(
        `You're tracking both weight and body fat, ${firstName} — the right combination. Weight alone doesn't tell the full story, but pairing it with fat percentage shows you what the weight is actually made of. That's where the real information lives.`,
      )
    }

    if (goalContextMessages.length > 0) {
      return pick(goalContextMessages, seed)
    }
  }

  // ── Priority 9: Fat distribution insight ─────────────────────────────────────
  const fatDist = fatDistribution(
    latest.fat_trunk_pct,
    latest.fat_right_leg_pct,
    latest.fat_left_leg_pct,
    gender
  )
  if (fatDist === 'android') {
    return pick([
      `Your fat is sitting more centrally — more in the trunk than in the legs, ${firstName}. Central fat has more metabolic impact, but it also responds well to cardio. Good thing to target.`,
      `${firstName}, your fat distribution is trunk-heavy. Central fat is more metabolically active than lower-body fat — and cardio is the most effective tool against it.`,
      `Fat is distributed more in the core and trunk than in the limbs, ${firstName}. This pattern responds very well to cardio — which is good, because it's also the most worthwhile to shift.`,
      `Central fat distribution, ${firstName}. More trunk than lower body. Not uncommon, but worth being intentional about — sustained cardio shifts this pattern.`,
      `${firstName}, your fat is carrying more centrally than in the limbs. That's the distribution that benefits most from cardio. Worth making it a priority.`,
    ], seed)
  }

  // ── Neutral / steady ─────────────────────────────────────────────────────────
  const waterOk = waterCategory(latest.water_pct, gender)
  if (waterOk === 'low') {
    return pick([
      `Body water is on the low side, ${firstName}. Consistent hydration also shows up in your other metrics — worth paying attention to.`,
      `Hydration is looking a bit low, ${firstName}. Body water percentage affects how muscle and fat readings come out — drink up.`,
      `${firstName}, body water is lower than ideal. It's one of those things that affects everything else — energy, readings, recovery.`,
      `Water percentage is a bit low, ${firstName}. Dehydration can make your other metrics look worse than they are — worth sorting before your next measurement.`,
      `${firstName}, hydration is on the low end. This affects your readings more than people realise — muscle and fat numbers shift with water levels.`,
      `Low body water, ${firstName}. Dehydration makes every other metric here less reliable. Drink water, then measure again and the picture will be clearer.`,
      `Body water is below ideal, ${firstName}. Hydration is the unglamorous one — but it underpins all the other numbers here.`,
    ], seed)
  }

  if (waterOk === 'good' && latest.water_pct != null) {
    return pick([
      `Hydration is looking good, ${firstName}. Well-hydrated bodies give more accurate readings on everything else in here too.`,
      `${firstName}, body water is in a healthy range. That's the quiet foundation that makes everything else more reliable.`,
      `Good hydration, ${firstName}. It's the metric nobody celebrates — but it's the one that underlies all the readings you do care about.`,
      `Body water is well within the healthy range, ${firstName}. This one's easy to overlook but it underpins the rest.`,
      `${firstName}, well hydrated. That matters more than people think — your other metrics will be sharper for it.`,
    ], seed)
  }

  return pick([
    `Holding steady, ${firstName}. Consistency is the whole game.`,
    `Numbers are stable, ${firstName}. Stable is good — it means you're maintaining what you've built.`,
    `All metrics holding, ${firstName}. Keep measuring and the trends will tell the story over time.`,
    `Steady as it goes, ${firstName}. Maintenance is underrated — it means the work you did is sticking.`,
    `${firstName}, everything's holding. Stability isn't nothing — it's proof the habits are working.`,
    `No big moves in the numbers, ${firstName}. Sometimes that's exactly what you want — consistency doing its job quietly.`,
    `${firstName}, steady numbers. Progress sometimes looks like nothing happening — when actually the habit is just holding.`,
    `Things are stable, ${firstName}. Not every measurement needs to be dramatic. This one confirms the floor is solid.`,
    `${firstName}, the numbers are holding. In a world where most people aren't measuring at all, holding steady is a real achievement.`,
    `Consistent, ${firstName}. The thing about consistency is you don't always feel it — but the numbers over time will show it.`,
    `${firstName}, stable across the board. That's your habits doing their job. The body is maintaining what you've built.`,
    `Nothing dramatic today, ${firstName}. The quiet measurements are the ones that prove you've got a routine.`,
  ], seed)
}
