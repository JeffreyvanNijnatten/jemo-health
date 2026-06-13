// Health range indicators per metric.
// Returns { label, color, description } based on value, optional gender, and optional ethnicity.
// Ethnicity adjustments: Deurenberg et al. 1998, WHO Expert Consultation 2004, Gallagher et al. 2000, IJO 2025.

import { fatBandBoundaries, type FatDistribution, type MuscleDistribution } from './references'

export type HealthStatus = 'great' | 'good' | 'ok' | 'attention'

export interface HealthRange {
  status: HealthStatus
  label: string
  description: string
  color: string
  bgColor: string
  textColor: string
}

const STATUSES: Record<HealthStatus, Pick<HealthRange, 'color' | 'bgColor' | 'textColor'>> = {
  great:     { color: '#0d9488', bgColor: '#daf7ee', textColor: '#0d9488' },
  good:      { color: '#7c6fa0', bgColor: '#e9e0f7', textColor: '#7c6fa0' },
  ok:        { color: '#b87333', bgColor: '#ffe9cf', textColor: '#b87333' },
  attention: { color: '#be5178', bgColor: '#fce0ee', textColor: '#be5178' },
}

function range(status: HealthStatus, label: string, description: string): HealthRange {
  return { status, label, description, ...STATUSES[status] }
}

// Rotates through description variants by calendar day — one rotation per 24 hours.
function pickDesc(descriptions: string[]): string {
  const day = Math.floor(Date.now() / 86400000)
  return descriptions[day % descriptions.length]
}

// ── BMI ───────────────────────────────────────────────────────────────────────
// WHO Expert Consultation 2004 · IDF metabolic syndrome criteria · IJO 2025
const BMI_NORMAL_MAX: Record<string, number> = {
  european: 24.9, east_asian: 22.9, south_asian: 22.9,
  african: 25.9, latino: 24.9, middle_eastern: 22.9,
}
const BMI_OVER_MAX: Record<string, number> = {
  european: 29.9, east_asian: 27.4, south_asian: 27.4,
  african: 30.9, latino: 27.4, middle_eastern: 27.4,
}

export function bmiRange(bmi: number, ethnicity?: string | null): HealthRange {
  const eth = ethnicity ?? 'european'
  const nMax = BMI_NORMAL_MAX[eth] ?? 24.9
  const oMax = BMI_OVER_MAX[eth] ?? 29.9

  if (bmi < 18.5) return range('attention', 'Underweight', pickDesc([
    `BMI below 18.5 can signal insufficient muscle, low bone density, or inadequate nutrition — each raising the risk of immune weakness, fatigue, and long-term frailty. Resistance training and adequate protein are the most effective routes to healthy weight gain.`,
    `Being underweight puts strain on hormonal function, immune response, and bone density. The goal isn't just more weight — it's more muscle. Resistance training builds healthy mass while strengthening bones and raising your resting metabolic rate.`,
    `Low BMI often reflects low muscle mass more than anything else. Building muscle through resistance training is the most effective route upward — it adds healthy weight, strengthens bones, and improves metabolic function at the same time.`,
    `The body needs adequate reserves to function optimally — for immune defence, hormone regulation, and injury recovery. Calorie-dense whole foods paired with resistance training and protein (around 1.6–2.0 g per kg of bodyweight) is the most effective path upward.`,
    `BMI below 18.5 is associated with increased risk of bone fractures, immune suppression, and poor recovery from illness or injury. Building muscle through resistance training addresses all three simultaneously.`,
    `Underweight means the body may be lacking the stores it needs for optimal hormone production, immune defence, and bone strength. Healthy weight gain through resistance training and adequate nutrition is the priority — not just eating more.`,
    `Low BMI can feel like a non-issue, but the body needs adequate reserves to run all its systems well. Muscle mass is particularly linked to immune strength, metabolic rate, and long-term resilience. Resistance training builds the right kind of weight.`,
  ]))

  if (bmi <= nMax) return range('great', 'Healthy', pickDesc([
    `BMI is in the healthy range for your reference group. Keep in mind BMI doesn't distinguish muscle from fat — a well-muscled person can read higher than expected. Use body fat percentage alongside this for a fuller picture.`,
    `Healthy BMI puts you in a range associated with lower long-term disease risk for your reference group. It's a useful starting point, but two people with the same BMI can have very different body compositions — body fat percentage tells you what the weight is actually made of.`,
    `In the healthy BMI zone for your reference group. BMI is a population-level tool — it was designed to compare groups, not individuals. What it does well is flag when weight is clearly outside healthy bounds. Yours is where it should be.`,
    `Healthy range for your profile. BMI is best used as a rough filter, not a precise metric — it ignores muscle mass entirely. Pair it with body fat percentage and the picture becomes much sharper.`,
    `BMI in the healthy range. Worth knowing: BMI correlates with health outcomes at the population level, but for individuals, body fat percentage and muscle mass are the more meaningful numbers. Yours is in a good place.`,
    `Your BMI sits in the range associated with the best long-term health outcomes for your reference group. It's a blunt tool — a muscular person can read as overweight — but healthy BMI is a reliable indicator that weight isn't a primary health concern.`,
    `Healthy BMI for your reference group. The value of this number is as a rough check — not a detailed assessment. Body fat percentage alongside it tells you far more about actual composition and health risk.`,
  ]))

  if (bmi <= oMax) return range('ok', 'Slightly high', pickDesc([
    `BMI is a little above the healthy range for your reference group (aim for ${nMax} or below). On its own it's a blunt tool — but if body fat is also elevated, both numbers point the same direction. Cardio and a modest calorie deficit move this.`,
    `Slightly elevated for your reference group. The critical question is what's driving it: extra muscle reads as high BMI but carries no health risk, while extra fat does. Check body fat percentage alongside this for a clearer picture.`,
    `Just above the healthy BMI range for your profile. BMI is most useful when it confirms what other metrics are showing. Compare it with your body fat percentage to understand whether this is worth acting on.`,
    `A little high for your reference group (target ${nMax} or below). Small, consistent changes in diet and cardio are the most sustainable way to bring it back. Even modest reductions produce visible results faster than most people expect.`,
    `BMI nudging above the healthy zone. It's a signal worth paying attention to, even though it's a blunt measure. The most effective response is consistent cardio alongside a small calorie deficit — nothing dramatic needed at this level.`,
    `Slightly above the ideal BMI for your profile. Early elevation is the easiest to address. Even modest reductions in calorie intake combined with regular cardio produce results faster than most people expect, and the numbers respond before you feel a visible change.`,
    `Above the healthy BMI range for your reference group, but not by a lot (aim for ${nMax} or below). Small, consistent changes in diet and movement are more effective than dramatic interventions here — the body responds well to steady, sustained pressure.`,
  ]))

  return range('attention', 'High', pickDesc([
    `BMI is well above the recommended range for your reference group (aim for ${nMax} or below). At this level, excess body fat raises insulin resistance, cardiovascular risk, and inflammation. Consistent cardio and diet changes move it — and early results come faster than most people expect.`,
    `High BMI is associated with meaningfully elevated risk of type 2 diabetes, cardiovascular disease, and chronic inflammation. The body responds well to lifestyle changes — and the first few weeks of cardio and dietary improvement often produce results faster than expected.`,
    `Well above the healthy range for your reference group. At this level, excess fat — particularly around the organs — carries real health consequences. Cardio is the fastest tool against visceral fat (the most risky type), which tends to come down first.`,
    `BMI significantly elevated for your reference group (aim for ${nMax} or below). Even a 5–10% reduction in body weight measurably reduces insulin resistance and cardiovascular risk — which means the early progress matters more than reaching the final goal.`,
    `Above the healthy BMI for your reference group. The combination of excess fat, often lower muscle mass, and elevated visceral fat creates a metabolic environment that's hard to sustain long-term. Cardio, resistance training, and a moderate calorie deficit all work together here.`,
    `High BMI is the reading that warrants making changes — and the good news is the body responds. Consistent cardio reduces visceral fat (the most metabolically disruptive type) fastest. Diet that reduces refined carbs and creates a moderate calorie deficit accelerates the results.`,
    `Well above the recommended range. BMI at this level is less about the number and more about what's driving it: excess fat raises insulin resistance, strains the heart, and increases systemic inflammation. Consistent effort in the right direction produces compound results over time.`,
  ]))
}

export function weightRange(weightKg: number, heightCm: number, ethnicity?: string | null): HealthRange {
  const h = heightCm / 100
  const bmi = weightKg / (h * h)
  const eth = ethnicity ?? 'european'
  const nMax = BMI_NORMAL_MAX[eth] ?? 24.9
  const oMax = BMI_OVER_MAX[eth] ?? 29.9
  const minKg = Math.round(18.5 * h * h)
  const maxKg = Math.round(nMax * h * h)
  const band = `${minKg}–${maxKg} kg`

  if (bmi < 18.5) return range('attention', 'Underweight', pickDesc([
    `Below the healthy weight range for your height (${band}). Low weight can mean insufficient muscle or nutrition — resistance training and adequate protein are the key levers upward.`,
    `Your weight is below the BMI-healthy range for your height (${band}). The most effective path up is building muscle through resistance training — it adds healthy weight while strengthening bones and raising metabolic rate.`,
    `Weight is below the range recommended for your height (${band}). The body needs adequate reserves for immune function, hormonal balance, and bone strength. Resistance training and calorie-dense nutrition builds the right kind of mass.`,
    `Below the healthy range for your height (${band}). BMI-based weight ranges are imperfect, but below this threshold the risks of inadequate muscle and bone density become meaningful. Resistance training paired with protein-rich nutrition is the most effective approach.`,
    `Your weight falls below the healthy BMI zone for your height (${band}). Being underweight is associated with weaker immunity, bone loss risk, and hormonal disruption. Building muscle through resistance training is preferable to passive weight gain.`,
    `Below the healthy weight for your height (${band}). Low weight often reflects low muscle mass — which affects metabolic rate, immune strength, and bone density. Resistance training and adequate protein intake together address all three.`,
    `Weight is below the range associated with good health outcomes for your height (${band}). Focus on building muscle rather than just calories — resistance training produces healthy weight gain that improves long-term metabolic and bone health.`,
  ]))

  if (bmi <= nMax) return range('great', 'Healthy weight', pickDesc([
    `Within the healthy weight range for your height (${band}). This is a useful reference — but body fat percentage and muscle mass together tell you more about what that weight is actually made of.`,
    `Healthy weight for your height (${band}). BMI-based weight ranges are a rough guide — they don't distinguish fat from muscle. Body fat percentage gives you the fuller picture of your composition.`,
    `Your weight is in the healthy BMI zone for your height (${band}). The number is a good starting point — the composition behind it (fat vs muscle) is where the real health story lives.`,
    `Weight in the healthy range for your height (${band}). Worth noting that BMI-healthy weight doesn't tell you what it's made of — a person with good muscle mass and low fat is very different from someone at the same weight with the opposite composition.`,
    `Healthy weight for your profile (${band}). It's in the right range — but the quality of that weight (muscle vs fat) matters for long-term health. Body fat percentage tells you that story.`,
    `In the healthy weight range for your height (${band}). This is where good outcomes are associated — though it's the composition behind the number (body fat and muscle) that actually determines metabolic health.`,
    `Weight is right where it should be for your height (${band}). Keep in mind this is a population-level estimate — body fat percentage and muscle mass give a more precise and actionable picture of your actual health.`,
  ]))

  if (bmi <= oMax) return range('ok', 'Slightly above', pickDesc([
    `A little above the healthy weight range for your height (${band}). Whether this is surplus fat or muscle matters — use body fat percentage alongside this to understand the composition.`,
    `Weight is slightly above the healthy range for your height (${band}). If body fat is also elevated, both numbers point toward the same goal. If it's muscle driving the weight, the concern is much lower.`,
    `Just above the healthy weight zone for your height (${band}). The key question is composition: extra muscle at this weight carries no health risk, while extra fat does. Body fat percentage clarifies which is true.`,
    `Slightly above the recommended range for your height (${band}). This level responds well to consistent cardio and a modest calorie deficit — nothing dramatic needed. Small changes compound quickly at this stage.`,
    `Weight is a little higher than ideal for your height (${band}). It's worth checking body fat percentage alongside this — a well-muscled person can read slightly above the BMI-healthy range without any real health concern.`,
    `Above the healthy weight range for your height (${band}). If body fat is also elevated, cardio and a small calorie deficit are the most effective approach. If muscle is driving the number, this reading matters less than the composition metrics.`,
    `Slightly above the healthy weight for your height (${band}). The most important thing to understand is what it's made of — body fat percentage tells you whether this weight is fat, muscle, or a mix of both.`,
  ]))

  return range('attention', 'Above range', pickDesc([
    `Above the healthy weight for your height (${band}). At this level, excess weight typically carries real metabolic consequences. Cardio, resistance training, and a modest calorie deficit all contribute — and early progress is usually faster than expected.`,
    `Weight is above the healthy range for your height (${band}). At this level, the excess is likely enough to affect insulin sensitivity and cardiovascular risk. Consistent cardio and a calorie deficit are the most effective tools — and the first results come faster than most people expect.`,
    `Above the recommended weight range for your height (${band}). This is the kind of reading that warrants action — and the good news is the body responds well to consistent lifestyle changes. Visceral fat tends to come down first, which produces the fastest health benefit.`,
    `Well above the healthy weight zone for your height (${band}). At this level, excess body fat raises insulin resistance and cardiovascular risk. Cardio and diet are the most effective combination — cardio moves visceral fat fastest, diet creates the calorie deficit needed for sustained loss.`,
    `Weight is significantly above the healthy range for your height (${band}). Consistent effort here produces real results — even modest reductions in body weight (5–10%) meaningfully lower blood pressure, insulin resistance, and cardiovascular risk.`,
    `Above the healthy weight for your height (${band}). The path down is straightforward even if it's not easy: consistent cardio, some resistance training to protect muscle during weight loss, and a moderate calorie deficit. The compound effect of all three together is faster than any one alone.`,
    `Well above the recommended range for your height (${band}). This reading points clearly toward making changes in diet and activity. The body responds to sustained effort — and the metabolic benefits of losing the first few kilograms show up in blood markers before they show up on the scale.`,
  ]))
}

// ── Body fat % ────────────────────────────────────────────────────────────────
// Age-banded thresholds + ethnicity corrections delegate to references.ts (single source of truth).
// distribution adjusts description text only — thresholds are population-calibrated.
export function bodyFatRange(
  pct: number,
  gender: number | null,
  age?: number | null,
  ethnicity?: string | null,
  distribution?: FatDistribution | null
): HealthRange {
  const { excellent, good, average } = fatBandBoundaries(gender, age ?? null, ethnicity ?? null)
  const essentialMin = gender !== 2 ? 5 : 14

  if (pct < essentialMin) return range('attention', 'Very low', pickDesc([
    `Below the essential fat threshold (${essentialMin}% for your profile). Essential fat keeps hormones, joints, and organs functioning — too little disrupts all three. Focus on adequate calories and healthy fats before reducing further.`,
    `Body fat is below the essential minimum for your profile (${essentialMin}%). Essential fat isn't excess — it's structural. It protects organs, supports hormone production, and keeps joints lubricated. At this level, those systems are under strain.`,
    `At this level, body fat has dropped below what the body needs to function properly (${essentialMin}% minimum for your profile). Hormonal disruption, immune weakness, and poor joint health are all associated with essential fat deficiency. Adequate calories and dietary fat are the priority.`,
    `Below the essential threshold (${essentialMin}% for your profile). The fat the body uses for hormone synthesis, organ protection, and nervous system function is running low. This isn't about aesthetics — it's a physiological minimum.`,
    `Essential fat is below the healthy minimum for your profile (${essentialMin}%). This level is associated with disrupted hormones, weakened immunity, and poor recovery. Healthy fats from diet — nuts, oils, fatty fish — alongside adequate calories help restore it.`,
    `Body fat has dropped below the essential minimum (${essentialMin}% for your profile). At this level, the body may start drawing on organ protection and hormonal reserves. Adequate calorie intake with sufficient dietary fat is the most effective way to restore this.`,
    `Very low body fat — below the essential minimum of ${essentialMin}% for your profile. Essential fat isn't surplus to requirements, it's required for hormone production, organ insulation, and joint function. Don't reduce further; focus on maintaining adequate intake.`,
  ]))

  if (pct < excellent) return range('great', 'Athletic', pickDesc([
    `Excellent body fat for your age and profile. At this level, stored fat is almost entirely functional with minimal excess — associated with strong metabolic health, lower cardiovascular risk, and efficient physical performance. Maintain with consistent training.`,
    `Athletic body fat percentage for your profile. This is in the range where body composition actively supports performance — cardiovascular efficiency, insulin sensitivity, and muscle-to-fat ratio are all at their best here. The habits that got you here keep you here.`,
    `Body fat in the athletic range for your profile. This level is associated with excellent metabolic health, high insulin sensitivity, and low cardiovascular risk. It takes real discipline to reach and consistent training to maintain.`,
    `Your body fat is in the athletic category for your age and profile — a level most people work hard to achieve. At this percentage, the body carries mostly functional fat with minimal excess, which supports efficient metabolism and physical performance.`,
    `Athletic body fat for your profile. This range is where body composition positively affects nearly every health marker — from insulin sensitivity to cardiovascular function to hormonal health. Worth maintaining with the training habits that built it.`,
    `Excellent body composition for your age and profile. Athletic-range body fat means minimal excess stored fat, which translates to better cardiovascular efficiency, lower inflammation, and more responsive metabolism. Consistent training keeps it here.`,
    `Body fat in the excellent range for your profile. At this level, the body is carrying close to its functional fat minimum — which is associated with lower disease risk, higher metabolic efficiency, and better physical performance. Keep the training consistent to protect it.`,
  ]))

  if (pct < good) {
    if (distribution === 'android') return range('good', 'Fit', pickDesc([
      `In a healthy range for your profile — though the fat is distributed more centrally (trunk) than in the limbs. Central fat carries slightly higher metabolic risk than the same amount stored in the legs. Cardio specifically targets this distribution pattern.`,
      `Healthy body fat percentage, but with a trunk-heavy distribution pattern. Central fat is more metabolically active than lower-body fat — meaning it has a bigger impact on insulin sensitivity and cardiovascular risk at the same overall percentage. Cardio is the most effective tool for shifting this pattern.`,
      `Body fat in the healthy range, but distributed more around the trunk than the limbs. This android distribution pattern means the same percentage carries slightly more metabolic risk than it would in a gynoid (lower-body) pattern. Sustained cardio targets central fat preferentially.`,
      `Good overall body fat level, but your fat is sitting more centrally. Central fat — stored around the trunk and organs — carries more health risk than the same amount stored in the legs and hips. Cardio is the best tool against this specific pattern.`,
      `Healthy fat percentage with a central distribution pattern. The trunk-heavy pattern means the metabolic impact is slightly higher than average for this range. The good news: central fat responds to cardio faster than lower-body fat. Prioritising aerobic exercise shifts this pattern over time.`,
      `Body fat is in a healthy range, but the distribution leans central (trunk over limbs). At the same overall percentage, central fat is associated with greater insulin resistance risk than peripheral fat. Consistent cardio — particularly moderate-intensity aerobic work — directly targets this pattern.`,
      `Healthy fat level overall, but distributed more centrally than is ideal. Fat stored in the trunk carries more metabolic consequence than the same amount in the limbs. Cardio doesn't just reduce fat — it specifically reduces central fat faster than other types.`,
    ]))
    return range('good', 'Fit', pickDesc([
      `In a healthy range for your age and profile. Body fat here supports normal hormonal function with minimal excess. Combined with good muscle mass, this is a solid composition.`,
      `Body fat in a healthy range for your profile. At this level, the balance between stored fat and lean mass is working well — insulin sensitivity, cardiovascular function, and hormonal health are all supported.`,
      `Healthy body fat for your age and profile. This range is where most health-positive outcomes are associated — not so low that essential functions are compromised, and not so high that metabolic risk increases.`,
      `Good body fat percentage for your age and profile. At this level, excess fat is minimal and body composition actively supports your health rather than working against it. The goal is to stay here.`,
      `Body fat is in a solid, healthy range for your profile. This is a meaningful place to be — it takes real effort to get here and consistent habits to maintain. The composition at this level supports good metabolic function.`,
      `Healthy fat percentage for your age and profile. This is the range where the body runs well — hormones, metabolism, and cardiovascular function are all well-supported at this level of body fat.`,
      `In the healthy range for your profile. Body fat here reflects good composition — not so lean that essential functions suffer, and with minimal excess that would raise metabolic risk. The habits that built this are the habits that protect it.`,
    ]))
  }

  if (pct < average) {
    if (distribution === 'android') return range('ok', 'Acceptable', pickDesc([
      `Slightly above the ideal range, with a central (trunk-heavy) distribution — a combination that meaningfully raises insulin resistance risk. Cardio is the most effective tool against both the level and the pattern.`,
      `Above ideal body fat with a central distribution pattern. This combination — elevated overall fat and trunk-heavy distribution — has a compounding effect on metabolic risk. Cardio addresses both: it reduces total fat and specifically targets central fat.`,
      `Body fat is slightly elevated and sitting more in the trunk than the limbs. Central fat at this level directly impairs insulin signalling and increases cardiovascular risk. Consistent cardio is the highest-leverage intervention here.`,
      `Above the ideal range with a trunk-heavy distribution. This specific combination raises metabolic risk more than the number alone suggests — central fat is more metabolically disruptive than lower-body fat at the same percentage. Prioritise cardio over diet alone.`,
      `Slightly above ideal, with fat concentrated more centrally than in the limbs. Android distribution amplifies the metabolic impact of elevated fat percentage. Cardio — particularly sustained aerobic exercise — is the most effective intervention for both.`,
      `Above ideal body fat with a central pattern. Fat stored around the trunk affects insulin sensitivity and cardiovascular markers more than lower-body fat does. Cardio addresses the distribution pattern as well as the overall level — make it the priority.`,
      `Elevated body fat with a trunk-heavy distribution is the combination that responds most reliably to cardio. Central fat is metabolically active — it releases inflammatory markers and disrupts insulin signalling — and it's also the fat type that cardio moves fastest.`,
    ]))
    if (distribution === 'gynoid') return range('ok', 'Acceptable', pickDesc([
      `Slightly above ideal for your profile. The lower-body distribution (legs and hips) is the safer pattern metabolically — it's less inflammatory than central fat — but reducing overall fat is still worthwhile. Diet and cardio will move it.`,
      `Body fat is a little above ideal, though the lower-body (gynoid) distribution is the more benign pattern. Lower-body fat is less metabolically disruptive than central fat — it doesn't impair insulin signalling in the same way. Still worth reducing overall.`,
      `Above the ideal range, but with a lower-body fat distribution — which is the less harmful pattern metabolically. Fat stored in the legs and hips is less inflammatory and less insulin-disruptive than trunk fat. Reducing overall fat is still the goal, but the risk profile here is lower than it would be with central distribution.`,
      `Slightly elevated body fat with a lower-body distribution pattern. The gynoid pattern (legs and hips) carries lower cardiovascular and metabolic risk than central fat at the same percentage. That said, reducing overall fat is still beneficial — diet and cardio together are the most effective approach.`,
      `Body fat above ideal, though the lower-body distribution means the metabolic risk is lower than it would be with a central pattern. Lower-body fat is more inert metabolically — but at this level, reducing overall fat is still the right goal. Cardio and moderate calorie deficit work well together.`,
      `Above ideal, with fat sitting more in the lower body than the trunk. This gynoid distribution is the safer pattern — lower-body fat is associated with lower cardiovascular risk than the same amount stored centrally. That advantage reduces somewhat at higher overall fat levels, so working toward the ideal range is worthwhile.`,
      `Slightly above ideal body fat with lower-body distribution. Lower-body fat (legs, hips) is less metabolically active than trunk fat and is considered cardioprotective at moderate levels. Even so, reducing overall body fat brings health benefits. Diet and cardio are the most effective combination.`,
    ]))
    return range('ok', 'Acceptable', pickDesc([
      `Slightly above the ideal range for your age and profile. At this level, excess fat begins to reduce insulin sensitivity and mildly elevates cardiovascular risk. A modest calorie deficit and regular cardio are the most effective approach.`,
      `Body fat is a little above ideal for your profile. This range is associated with mild reductions in insulin sensitivity and slightly elevated cardiovascular risk — enough to be worth addressing, not enough to be alarming. Consistent cardio and diet are the tools.`,
      `Above the ideal for your age and profile, but not dramatically so. At this level, fat is starting to have a meaningful effect on insulin signalling and metabolic efficiency. Cardio and a moderate calorie deficit will bring it down over time.`,
      `Body fat slightly above the healthy range for your profile. The impact at this level is real but reversible: reduced insulin sensitivity, mildly elevated cardiovascular risk, and slightly lower metabolic efficiency. Consistent effort corrects all three.`,
      `A little above ideal for your age and profile. Fat percentage at this level begins to affect metabolism — insulin sensitivity drops, cardiovascular risk increases slightly, and inflammation starts to tick upward. Small, consistent changes in diet and cardio move it effectively.`,
      `Above the ideal fat range for your profile. This is the zone where body composition begins to work against metabolism rather than with it — insulin sensitivity is reduced and cardiovascular risk is slightly elevated. Both respond well to sustained cardio and a modest calorie deficit.`,
      `Slightly above ideal body fat for your age and profile. At this level, excess fat is real enough to affect insulin function and cardiovascular markers. The good news: this range responds quickly to lifestyle changes — early effort produces results faster than you'd expect.`,
    ]))
  }

  if (distribution === 'android') return range('attention', 'High', pickDesc([
    `Above the healthy range with a central (trunk-heavy) distribution — this combination significantly raises insulin resistance and cardiovascular risk. Cardio is the highest-leverage intervention: it reduces total fat and targets central fat specifically.`,
    `High body fat with a trunk-heavy distribution is the highest-risk combination on this page. Central fat — stored around the organs — is the most metabolically disruptive type. Cardio addresses both the level and the pattern more effectively than diet alone.`,
    `Body fat is above the healthy range and concentrated centrally. The android pattern amplifies the metabolic impact of high body fat — central fat releases inflammatory compounds, disrupts insulin signalling, and directly raises cardiovascular risk. Consistent cardio is the most effective intervention.`,
    `Above the healthy range with central distribution — the pattern most closely linked to metabolic syndrome, insulin resistance, and cardiovascular disease. Sustained cardio reduces central fat faster than any other intervention. Diet reduces calories; cardio targets the pattern.`,
    `High body fat with a trunk-heavy distribution means two risk factors compounding each other. Central fat is the most metabolically dangerous type — it sits near vital organs and drives insulin resistance. Start with cardio: it moves central fat faster than diet or any other exercise type.`,
    `The combination of high overall fat and central distribution is the most impactful to address. Central fat is not just cosmetically different from lower-body fat — it actively disrupts hormonal signalling and insulin function. Cardio first, diet second. Both are needed.`,
    `Above the healthy range with a central fat pattern. This combination warrants urgent attention — central fat drives insulin resistance, cardiovascular risk, and systemic inflammation at levels that compound over time. The good news: it responds to cardio faster than any other fat type. Start there.`,
  ]))
  if (distribution === 'gynoid') return range('attention', 'High', pickDesc([
    `Above the healthy range for your profile. The lower-body distribution (legs and hips) is less metabolically harmful than central fat, but at this level the total excess still raises health risk. Consistent cardio and a moderate calorie deficit are the most effective approach.`,
    `Body fat is above the healthy range, though the lower-body distribution is the more benign pattern. Lower-body fat is less inflammatory than central fat — but at high overall levels, the advantage diminishes. Reducing total fat is the goal.`,
    `High overall body fat, with a lower-body distribution pattern. Gynoid fat is less metabolically disruptive than android (central) fat — it doesn't impair insulin signalling as aggressively. But at this level of total fat, reducing overall body fat is important regardless of distribution.`,
    `Above the healthy range for your profile. The lower-body pattern is the safer distribution — fat in the legs and hips carries less cardiovascular risk than trunk fat. However, at high total levels, the benefit of distribution type is reduced. Cardio and calorie deficit together are the priority.`,
    `High body fat with a lower-body distribution. Lower-body fat is associated with lower inflammatory markers and cardiovascular risk than central fat — that's a meaningful advantage. But total fat at this level still needs addressing. Sustained cardio and moderate calorie deficit work well together.`,
    `Body fat is above the healthy range, with distribution toward the lower body. The gynoid pattern has better metabolic properties than central fat — it's less insulin-disruptive and less inflammatory. Even so, at this level of total fat, reducing it is important. Diet and cardio are the tools.`,
    `Above the healthy range for your profile. Lower-body fat distribution is the safer pattern, carrying less cardiovascular and metabolic risk than trunk-centred fat. The advantage is real but limited at high overall fat levels — reducing total body fat through cardio and calorie deficit is the priority.`,
  ]))
  return range('attention', 'High', pickDesc([
    `Above the healthy range for your age and profile. Excess body fat at this level reduces insulin sensitivity, raises cardiovascular risk, and increases inflammation. Consistent cardio and a modest calorie deficit move it — and visceral fat (if elevated) comes down first.`,
    `Body fat above the healthy range for your profile. At this level, excess fat is directly reducing insulin sensitivity, raising cardiovascular risk, and increasing systemic inflammation. Cardio and a calorie deficit are both necessary — and the early results come faster than most people expect.`,
    `Above the healthy fat range for your age and profile. This level carries real health consequences — reduced insulin sensitivity, elevated cardiovascular risk, and increased inflammation are all associated with this range. Consistent effort in the right direction produces compound results over time.`,
    `High body fat for your profile. At this level, the body's metabolic function is working against itself — insulin sensitivity is reduced, fat tissue is releasing inflammatory compounds, and cardiovascular risk is elevated. Cardio and moderate calorie deficit are the most effective tools.`,
    `Body fat is above where it should be for your age and profile. The metabolic consequences at this level are meaningful — insulin resistance, cardiovascular strain, and chronic low-grade inflammation. The approach that works best: sustained cardio, some resistance training to protect muscle, and a moderate calorie deficit.`,
    `Above the healthy range for your profile. Excess body fat at this level affects multiple systems simultaneously — insulin function, cardiovascular health, hormone balance, and inflammatory response. Cardio moves it fastest, particularly visceral fat. Diet creates the calorie conditions for sustained loss.`,
    `High body fat for your age and profile. This is the reading that warrants making real changes — not one-off efforts, but sustained habits. Cardio first for visceral fat, then diet for sustained calorie deficit. Resistance training protects muscle during the process and raises resting burn.`,
  ]))
}

// ── Muscle mass ───────────────────────────────────────────────────────────────
// Skeletal Muscle Mass Index (SMMI) = muscle_kg / height_m².
// Thresholds: fitness ranges extended upward from AWGS 2019 BIA sarcopenia cutoffs
// (men < 7.0 kg/m², women < 5.7 kg/m²). Age adjustment: −0.5 (40–59), −1.0 (60+).
export function muscleMassRange(
  muscleKg: number,
  heightCm: number | null,
  gender: number | null,
  age?: number | null,
  distribution?: MuscleDistribution | null
): HealthRange {
  if (!heightCm) return range('good', 'Recorded', 'Add height to your profile for a full assessment')

  const h = heightCm / 100
  const smmi = muscleKg / (h * h)
  const a = age ?? 35
  const ageAdj = a >= 60 ? -1.0 : a >= 40 ? -0.5 : 0
  const male = gender !== 2

  const [tGreat, tGood, tOk] = male ? [11.0, 9.5, 8.0] : [7.5, 6.5, 5.7]

  const distNote = distribution === 'leg_dominant'
    ? ' Leg muscle is the largest muscle group in the body and the most protective for long-term metabolism, balance, and mobility.'
    : distribution === 'upper_dominant'
    ? ' Building more leg muscle would further reduce sarcopenia risk — the legs are the most metabolically important group, and their size relative to total muscle matters for long-term health.'
    : ''

  if (smmi >= tGreat + ageAdj) return range('great', 'Excellent', pickDesc([
    `Well above the healthy muscle range for your age and profile. High muscle mass drives a faster resting metabolic rate, improves insulin sensitivity, protects bones and joints, and is one of the strongest predictors of healthy ageing. Keep training.${distNote}`,
    `Excellent muscle mass for your profile. Muscle is metabolically expensive tissue — it raises how much your body burns at rest, improves insulin sensitivity, and provides the structural support that protects joints and bones long-term. The training built this.${distNote}`,
    `Muscle mass is well above average for your profile — a genuinely meaningful health marker. High muscle mass is associated with lower risk of type 2 diabetes, better cardiovascular health, stronger bone density, and more resilient metabolism as you age. Protect it with consistent training.${distNote}`,
    `Above-average muscle mass for your age and profile. Muscle is the tissue that pays the most dividends over time — it raises your resting calorie burn, protects you from fat gain during lower-activity periods, and keeps metabolic function strong as you age.${distNote}`,
    `Excellent muscle levels for your profile. More muscle means a higher resting burn, better insulin sensitivity, stronger bones, and more protection against the natural decline of muscle with age (sarcopenia). The work that built this is the work that keeps it.${distNote}`,
    `Muscle mass is well above the healthy range for your age and profile. This is one of the best long-term health investments you can make — high muscle is associated with lower mortality risk, better glucose regulation, and sustained metabolic rate as you age. Keep it going.${distNote}`,
    `Well-developed muscle mass for your profile. High muscle mass is one of the strongest predictors of long-term health — it drives resting metabolic rate, protects insulin function, strengthens bones, and reduces the risk of metabolic decline. The habits that built this are worth protecting.${distNote}`,
  ]))

  if (smmi >= tGood + ageAdj) return range('good', 'Good', pickDesc([
    `In a solid healthy range for your profile. Good muscle mass supports your resting metabolism, protects against fat gain during lower-activity periods, and reduces the risk of sarcopenia as you age. Building more is always worthwhile.${distNote}`,
    `Good muscle mass for your age and profile. Muscle drives resting calorie burn, supports insulin sensitivity, and protects joints and bones. The good news: you're in a healthy range, and building further from here continues to compound those benefits.${distNote}`,
    `Solid muscle mass for your profile. At this level, muscle is doing its job — supporting your metabolism, protecting against fat accumulation, and keeping insulin sensitivity healthy. There's always benefit in building more, but you're in a good place.${distNote}`,
    `Muscle is in a healthy range for your profile. Good muscle mass means a higher resting burn, better glucose regulation, and meaningful protection against sarcopenia as you age. Consistent resistance training keeps it here and slowly builds it higher.${distNote}`,
    `Good muscle levels for your age and profile. Muscle is the most metabolically active tissue in the body — it burns calories at rest, protects joints, and maintains bone density. The goal is always to build more, but this is a strong foundation.${distNote}`,
    `In the healthy muscle range for your profile. Muscle mass here means your resting metabolic rate is well-supported and your joints and bones have meaningful protection. Building further from this base makes every metric easier to improve.${distNote}`,
    `Good muscle mass for your profile — a meaningful marker of metabolic health. At this level, your resting burn is supported, insulin sensitivity is healthy, and your body has real protection against the natural loss of muscle that comes with age. Training consistently keeps the number moving.${distNote}`,
  ]))

  if (smmi >= tOk + ageAdj) return range('ok', 'Adequate', pickDesc([
    `Within the healthy range, but on the lower side for your profile. Muscle mass drives resting calorie burn and protects joints and bones — building more pays dividends long-term. Resistance training 2–3× per week with adequate protein (around 1.6–2.0 g per kg of bodyweight) is the most effective approach.${distNote}`,
    `Adequate muscle mass for your profile — in range, but worth building further. More muscle means a higher resting burn, better insulin sensitivity, and more protection against muscle loss with age. Resistance training and protein intake are the two most effective levers.${distNote}`,
    `Within range, but muscle mass is on the lower end for your profile. Building more is worthwhile at any age — each kilogram of muscle raises your resting calorie burn and provides structural support for joints and bones. Resistance training 2–3× per week is the most direct path.${distNote}`,
    `Muscle mass is within the healthy range for your profile, but building more would improve long-term metabolic health. More muscle means a faster resting metabolism, better glucose regulation, and more resilience against the decline of muscle with age. Resistance training and protein make it happen.${distNote}`,
    `Adequate muscle for your profile. This range means the basics are covered — but there's meaningful health benefit in building further. Muscle mass is one of the most impactful things you can improve: it raises resting burn, protects joints and bones, and supports metabolic health long-term.${distNote}`,
    `In range, but on the lower side for your profile. Muscle mass at this level is functional, but building further reduces the risk of sarcopenia, raises your resting metabolic rate, and improves insulin sensitivity. Resistance training with adequate protein is the most effective route.${distNote}`,
    `Muscle mass is adequate for your profile, but there's meaningful value in building more. Muscle drives resting calorie burn, protects bones and joints, and maintains metabolic function as you age. Even modest gains from resistance training produce measurable improvements across all of these.${distNote}`,
  ]))

  return range('attention', 'Below range', pickDesc([
    `Below the recommended muscle range for your age and profile. Low muscle mass raises the risk of metabolic slowdown, fat gain, poor glucose regulation, and joint vulnerability with age. Resistance training and protein (1.6–2.0 g per kg bodyweight) are the fastest levers — even modest gains make a measurable difference.${distNote}`,
    `Muscle mass is below the healthy range for your profile. Low muscle means a lower resting metabolic rate, reduced insulin sensitivity, and less structural protection for joints and bones. Resistance training 2–3× per week and adequate protein are the most direct and effective interventions.${distNote}`,
    `Below the recommended muscle range for your age and profile. This is the metric with some of the highest leverage for long-term health: building muscle raises resting burn, improves glucose regulation, strengthens bones, and reduces the risk of frailty with age. Resistance training and protein are the tools.${distNote}`,
    `Muscle mass is below the healthy range for your profile. Low muscle is associated with slower metabolism, higher risk of fat gain, reduced insulin sensitivity, and greater joint vulnerability. Resistance training and protein intake together address all of these — and results are measurable within weeks.${distNote}`,
    `Below range for your age and profile on muscle mass. This is worth prioritising: low muscle raises the risk of metabolic slowdown and is the primary driver of sarcopenia (age-related muscle loss). Resistance training 2–3× per week with protein (1.6–2.0 g per kg bodyweight) is the most effective response.${distNote}`,
    `Muscle mass is below the recommended range for your profile. The consequences of low muscle go beyond the gym: reduced resting burn, weaker bones, poorer glucose regulation, and higher risk of fat accumulation. Resistance training and adequate protein address each of these directly.${distNote}`,
    `Below the healthy muscle range for your profile. Low muscle mass affects metabolism, bone density, insulin function, and joint health — all at once. The good news is muscle responds to training at any age. Resistance exercise 2–3× per week and protein around 1.6–2.0 g per kg bodyweight are the most direct levers.${distNote}`,
  ]))
}

// ── Visceral fat ──────────────────────────────────────────────────────────────
// TANITA official scale: 1–12 healthy · 13–19 elevated · 20–59 high
// Visceral fat surrounds internal organs (liver, pancreas, intestines).
// It is the most metabolically active fat type — most strongly linked to insulin resistance and CVD.
export function visceralFatRange(level: number): HealthRange {
  if (level <= 12) return range('great', 'Healthy', pickDesc([
    `Visceral fat surrounds the internal organs — liver, pancreas, intestines. At levels 1–12 it causes no metabolic disruption and the organs are well-protected. It's the most important fat type to keep in range: even small increases start affecting insulin signalling. Regular movement and a diet low in refined carbs keep it here.`,
    `Visceral fat is in the healthy range. This is the fat that matters most for internal health — it wraps around the liver, pancreas, and intestines and is the primary driver of insulin resistance and cardiovascular risk when elevated. Keeping it in range is one of the best things you can do for long-term metabolic health.`,
    `Healthy visceral fat level. Visceral fat is more metabolically active than subcutaneous fat (the kind under the skin) — at elevated levels it releases inflammatory compounds and disrupts insulin function. In the healthy range, it's not causing those issues. Keep it here with consistent movement and a diet low in refined carbs.`,
    `Visceral fat is at a healthy level — meaning no excess fat is accumulating around the internal organs. This is the most consequential fat type for health, and keeping it in range is protective against insulin resistance, metabolic syndrome, and cardiovascular disease. Regular cardio and a good diet maintain this.`,
    `Healthy range for visceral fat. The organs are well-protected with no excess surrounding fat. Visceral fat is uniquely dangerous when elevated — it actively disrupts insulin signalling and increases cardiovascular risk — so keeping it in this range is worth protecting. Movement and diet are the key levers.`,
    `Visceral fat is in the ideal range (1–12 on the TANITA scale). This fat type wraps around vital organs and, when elevated, is more harmful than any other fat type — directly linked to type 2 diabetes, heart disease, and metabolic syndrome. In the healthy range, it's protecting rather than threatening. Keep the habits that brought you here.`,
    `Good visceral fat level. This is the fat inside the abdominal cavity surrounding the organs — not the kind you can pinch, but the kind that matters most for long-term health. At levels 1–12, it's in the ideal range. Regular cardio and a diet low in sugar and refined carbs keep it here over time.`,
  ]))

  if (level <= 19) return range('ok', 'Elevated', pickDesc([
    `Visceral fat at 13–19 is accumulating around the organs and actively impairing insulin signalling — the first step toward metabolic syndrome and increased cardiovascular risk. Consistent moderate-intensity cardio (3–5× per week) and reducing refined carbs and sugar are the most effective interventions.`,
    `Elevated visceral fat means fat is building up around the internal organs — liver, pancreas, intestines. At this level, it starts impairing how well insulin works, raising cardiovascular risk, and contributing to systemic inflammation. Cardio is the fastest tool to reduce it.`,
    `Visceral fat is in the elevated range (13–19). This fat type sits around the organs — not under the skin — and at this level it's already affecting insulin function and metabolic health. The good news: visceral fat responds to lifestyle change faster than any other fat type. Sustained cardio and fewer refined carbs move it quickly.`,
    `Visceral fat has moved into the elevated range. It's building up around the organs and beginning to disrupt insulin signalling — the precursor to metabolic syndrome. Consistent cardio (even 30 minutes, 3–5 times per week) directly reduces this fat type. Cutting refined carbs and sugar accelerates the response.`,
    `Elevated visceral fat — fat accumulating around the internal organs. At 13–19, the metabolic effects are beginning: insulin sensitivity is reducing and cardiovascular risk is starting to climb. The good news is that visceral fat is highly responsive to cardio. Start there; diet supports the results.`,
    `Visceral fat is above the healthy range, accumulating around the organs. At this level it actively disrupts insulin function and begins raising cardiovascular risk. This fat type responds to exercise faster than subcutaneous fat — consistent moderate cardio is the most effective intervention. Reducing refined carbs amplifies the effect.`,
    `Visceral fat in the elevated range means the organs are surrounded by more fat than is healthy. This level is linked to early insulin resistance and increased metabolic syndrome risk. The reassuring thing: visceral fat is the most responsive fat type to lifestyle change. Cardio moves it faster than anything else.`,
  ]))

  return range('attention', 'High', pickDesc([
    `Visceral fat at 20+ is the most significant modifiable health risk on this page. At this level it substantially raises the risk of type 2 diabetes, cardiovascular disease, and chronic inflammation. It's also the most responsive fat to lifestyle change — cardio moves it faster than any other type. Start with consistent cardio, then diet: reducing refined carbs and sugar accelerates the results.`,
    `High visceral fat is the most urgent number on this page. At 20+, fat surrounding the organs is driving insulin resistance, elevating cardiovascular risk, and increasing chronic inflammation — all simultaneously. Cardio is the highest-leverage intervention: it reduces visceral fat faster than any other lifestyle change. Diet supports the effort.`,
    `Visceral fat is in the high range (20+). This is the fat that surrounds the liver, pancreas, and intestines — and at this level it's significantly disrupting insulin function, raising the risk of type 2 diabetes and cardiovascular disease, and driving chronic inflammation. The most effective response is consistent cardio, followed by reducing refined carbs and sugar.`,
    `At 20+, visceral fat is at a level that poses real health risk — directly linked to type 2 diabetes, cardiovascular disease, insulin resistance, and metabolic syndrome. The body is surrounded by internal fat that's actively disrupting metabolic function. The good news: visceral fat responds to cardio faster than any other fat type. Start there and results come sooner than expected.`,
    `High visceral fat (20+). This is the metric with the most direct link to serious long-term disease risk: type 2 diabetes, heart disease, and insulin resistance are all significantly elevated at this level. It's also the most modifiable — visceral fat responds to sustained cardio faster than any other fat type. This is where to focus first.`,
    `Visceral fat above 20 is clinically significant. It means fat is heavily accumulating around the organs — liver, pancreas, intestines — and actively driving insulin resistance and cardiovascular disease risk. Cardio is the most effective single intervention for visceral fat, and results come faster than most people expect. Combine with a diet lower in refined carbs and sugar for best results.`,
    `At 20+, visceral fat is in the range associated with the highest disease risk. This fat type doesn't sit under the skin — it wraps around vital organs and directly disrupts hormonal and metabolic function. The urgency is real, but so is the body's response to change: visceral fat is the first type to go when you commit to consistent cardio and a cleaner diet.`,
  ]))
}

// ── Metabolic age ─────────────────────────────────────────────────────────────
// Metabolic age is estimated from resting metabolic rate (RMR) compared to
// population average RMR values by age group. It reflects how efficiently the
// body burns energy at rest — driven primarily by muscle mass and body composition.
export function metabolicAgeRange(metabolicAge: number, actualAge: number): HealthRange {
  const diff = metabolicAge - actualAge
  if (diff <= -5) return range('great', `${Math.abs(diff)} yrs younger`, pickDesc([
    `Your resting metabolic rate matches someone ${Math.abs(diff)} years younger — meaning your body demands more energy even at rest. This is driven almost entirely by muscle mass and body composition, and is one of the best long-term markers of metabolic health. The result of consistent training and a healthy body composition.`,
    `Your metabolism is running ${Math.abs(diff)} years younger than your actual age. Metabolic age is determined by resting metabolic rate — how much energy your body burns doing nothing. Muscle mass is the primary driver, and yours is clearly doing its job.`,
    `Metabolically, your body is performing like someone ${Math.abs(diff)} years younger. This reflects strong muscle mass and efficient body composition — muscle is metabolically expensive tissue and raises how much you burn at rest. The habits that built your muscle built this number.`,
    `Your resting metabolic rate is equivalent to someone ${Math.abs(diff)} years younger than you. This is one of the most meaningful health markers there is — it tells you your body is running efficiently, with sufficient muscle mass to sustain a higher metabolic demand. The training is paying off.`,
    `Metabolic age is ${Math.abs(diff)} years younger than your actual age. A younger metabolic age means a higher resting metabolic rate — your body burns more energy even when inactive. This is almost entirely driven by muscle mass. The more muscle you have, the more fuel your body demands, and yours is demanding more than average.`,
    `Your body is running metabolically younger than your years — by ${Math.abs(diff)} years. Resting metabolic rate (what's behind this number) is largely determined by how much muscle you carry. Yours is clearly above average for your age, which explains both the strong metabolic age and the efficient calorie burn at rest.`,
    `${Math.abs(diff)} years metabolically younger than your actual age. This is the compound result of good body composition and consistent training — a younger metabolic age means a higher resting burn, better insulin sensitivity, and a body that's running more efficiently than most people your age.`,
  ]))

  if (diff <= 0) return range('good', 'On point', pickDesc([
    `Your resting metabolic rate is in line with your actual age — muscle mass and body composition are balanced. To run metabolically younger, building muscle is the single most effective lever: each kilogram of muscle burns roughly 13 kcal per day at rest, compounding over time.`,
    `Metabolic age is right at your actual age — a solid baseline. Your resting metabolic rate matches the average for your age group, which means muscle mass and body composition are well balanced. Building muscle is the most direct route to running metabolically younger.`,
    `Your metabolic age matches your actual age — meaning your resting burn is in line with average for your age group. This is a healthy baseline. Resistance training and building muscle is the most effective way to lower your metabolic age: more muscle means more fuel demanded at rest.`,
    `Metabolic age is on point with your actual age. Resting metabolic rate — what this is based on — reflects how much energy the body burns doing nothing, driven primarily by muscle mass. You're average for your age group. Building more muscle would push you below your actual age.`,
    `Your resting metabolic rate is on par with the average for your age — a good baseline. To improve metabolic age, muscle is the lever: each kilogram of muscle burns roughly 13 kcal per day at rest. More muscle means a younger metabolic age, automatically.`,
    `Metabolic age aligned with your actual age. Your resting calorie burn matches what's expected for your age group, which means body composition is in a reasonable balance. Resistance training and building muscle would bring the metabolic age down over time — muscle is the primary driver.`,
    `Your metabolic rate is running in line with your age group — a healthy baseline. Metabolic age reflects how much the body burns at rest, and muscle mass is the primary driver. If you're doing resistance training, this number will continue to improve. If not, it's the most effective investment you can make for it.`,
  ]))

  if (diff <= 5) return range('ok', `${diff} yrs older`, pickDesc([
    `Your resting metabolic rate is running slightly slower than average for your age — equivalent to someone ${diff} years older. This usually reflects a moderate muscle deficit or elevated body fat. Both are reversible: resistance training 2–3× per week and adequate protein (1.6–2.0 g per kg bodyweight) raise the metabolic rate measurably within weeks.`,
    `Metabolic age is ${diff} years above your actual age, meaning your resting burn is a little below average for your age group. This is usually driven by lower-than-average muscle mass. Building muscle through resistance training is the most direct fix — each kg of muscle raises the resting burn.`,
    `Your metabolism is running a little older than your years (by ${diff} years). Resting metabolic rate is mostly determined by muscle mass — and yours appears slightly below average for your age. Resistance training is the most effective lever: 2–3 sessions per week with adequate protein produces measurable improvements within weeks.`,
    `Metabolic age is ${diff} years above your actual age. Your resting calorie burn is a little below average for your age group — typically a sign of slightly lower muscle mass or higher body fat. Both respond well to resistance training and adequate protein intake.`,
    `Your resting metabolic rate is slightly below average for your age, putting your metabolic age ${diff} years ahead of your actual age. This usually means muscle mass is a bit lower than ideal. Resistance training and protein (1.6–2.0 g per kg bodyweight) are the fastest routes to closing the gap.`,
    `Metabolic age running ${diff} years above your actual age. Your body is burning slightly less at rest than average for your age group — which is usually about muscle mass. Building muscle is the highest-leverage thing you can do for metabolic age: more muscle means a faster resting burn, automatically lowering the metabolic age.`,
    `Your resting metabolic rate is a little below average for your age (${diff} years above on the metabolic scale). This is very fixable — resistance training builds muscle, and muscle is the tissue that drives resting calorie burn. Even modest muscle gains produce a measurable shift in metabolic age.`,
  ]))

  return range('attention', `${diff} yrs older`, pickDesc([
    `Your resting metabolic rate is significantly below average for your age group — equivalent to someone ${diff} years older. This is almost always driven by insufficient muscle mass. Building muscle through resistance training is the most direct fix: muscle is metabolically expensive tissue, and even modest gains raise how much your body burns at rest. More muscle → higher resting burn → younger metabolic age.`,
    `Metabolic age is ${diff} years above your actual age — a meaningful gap. Your resting metabolic rate is well below average for your age group, which usually reflects a significant muscle deficit. Resistance training is the most direct solution: building muscle raises resting burn in a way that nothing else replicates.`,
    `Your metabolism is running ${diff} years older than it should. Resting metabolic rate this low relative to your age group almost always reflects insufficient muscle mass. Resistance training 2–3× per week and protein intake around 1.6–2.0 g per kg bodyweight are the most effective levers — and the changes are measurable within weeks.`,
    `Metabolic age is significantly above your actual age (${diff} years). This gap reflects a resting metabolic rate well below average — usually driven by low muscle mass, higher body fat, or both. Building muscle through resistance training is the most impactful single change: muscle demands fuel at rest, raising the metabolic rate automatically.`,
    `Your resting metabolic rate is ${diff} years below average for your age group. This is the consequence of insufficient muscle mass and/or elevated body fat. The path forward is clear: resistance training builds muscle, and muscle is what drives the resting burn upward. More muscle means a younger metabolic age over time.`,
    `Metabolic age running ${diff} years above your actual age is a significant gap. Your body is burning substantially less at rest than average for your age group. This almost always points to low muscle mass. Resistance training — consistently, 2–3× per week — is the most effective intervention. Protein intake (1.6–2.0 g per kg bodyweight) supports muscle building and compounds the results.`,
    `Your resting metabolic rate is significantly lower than average for your age, placing your metabolic age ${diff} years ahead. The body runs slower at rest when muscle mass is low — and muscle is what raises the floor. Resistance training and adequate protein are the direct levers. Even modest gains in muscle make a measurable difference to how much your body burns every day.`,
  ]))
}

// ── Body water ────────────────────────────────────────────────────────────────
export function waterPctRange(waterPct: number, gender?: number | null): HealthRange {
  const lo = gender === 1 ? 50 : 45
  const hi = gender === 1 ? 65 : 60

  if (waterPct > hi) return range('ok', 'A little high', pickDesc([
    `Slightly above the typical range (${lo}–${hi}%). This can reflect recent high fluid intake, water retention from inflammation or high sodium, or hormonal fluctuation. Not a health concern on its own — but worth noting if consistently elevated.`,
    `Body water is a little above the typical healthy range (${lo}–${hi}%). This can happen after high fluid intake, after eating salty foods, or due to hormonal changes. It usually self-corrects within a day or two and isn't a concern on its own.`,
    `Above the typical body water range (${lo}–${hi}%). Elevated body water can indicate water retention — often from high sodium intake, inflammation, or hormonal shifts. It's not usually a health concern, but if it persists it's worth monitoring alongside sodium intake.`,
    `Body water is slightly above the expected range (${lo}–${hi}%). This sometimes reflects water retention from high salt intake or a recent heavy meal, mild inflammation, or hormonal changes during a cycle. Not a concern if occasional — worth noting if it's consistently this high.`,
    `A little high on body water (above ${hi}%). This can reflect excess fluid retention rather than optimal hydration — often caused by high sodium, inflammation, or hormonal factors. Reducing salt intake and monitoring over a few days usually reveals whether it's persistent.`,
    `Slightly above the healthy water range (${lo}–${hi}%). Elevated body water percentage can indicate water retention, which is often temporary and tied to sodium intake, inflammation, or hormonal shifts. It typically normalises on its own.`,
    `Body water reading is above the typical range (${lo}–${hi}%). This often reflects water retention from diet (particularly salt), inflammation, or hormonal changes rather than a hydration issue. It usually self-corrects and isn't a concern unless consistently elevated over multiple measurements.`,
  ]))

  if (waterPct >= lo) return range('great', 'Well hydrated', pickDesc([
    `Body water is in the healthy range (${lo}–${hi}%). Good hydration matters for more than thirst — it directly affects how accurate your body composition readings are. Dehydration inflates body fat percentage and deflates muscle readings. Well hydrated means the numbers here reflect reality.`,
    `Well hydrated — body water is in the healthy range (${lo}–${hi}%). This matters beyond just feeling good: your body composition readings (fat %, muscle mass) are more accurate when well hydrated, as bio-electrical measurements are sensitive to fluid levels.`,
    `Body water is right where it should be (${lo}–${hi}%). Healthy hydration supports every system in the body — nutrient transport, temperature regulation, joint lubrication, and energy production. It also means the body composition numbers on this page are more reliable.`,
    `Healthy hydration (${lo}–${hi}%). Good body water percentage is the quiet foundation of accurate readings — dehydration artificially inflates body fat % and reduces muscle readings. Well hydrated means the numbers here reflect your actual composition rather than a dehydrated snapshot.`,
    `Body water in the healthy range (${lo}–${hi}%). Hydration at this level means the body's systems are running with adequate fluid — energy, recovery, nutrient transport, and kidney function are all supported. It also means the bio-electrical readings used for fat and muscle are more accurate.`,
    `Well hydrated, with body water in the ideal range (${lo}–${hi}%). Good hydration affects more than energy and thirst — it directly determines how accurately TANITA measures your fat and muscle. Dehydration makes fat look higher and muscle look lower than reality. Your readings today are reliable.`,
    `Body water is in the healthy zone (${lo}–${hi}%). This is the metric that makes all the other readings more reliable — well-hydrated tissue conducts the bio-electrical signal better, which is how TANITA measures fat and muscle. Keep drinking consistently through the day.`,
  ]))

  if (waterPct >= lo - 5) return range('ok', 'Slightly low', pickDesc([
    `Body water is a little below optimal (aim for ${lo}% or above). Even mild dehydration of 1–2% can make body fat read higher than it actually is and muscle read lower. Drinking consistently through the day — not just when thirsty — usually corrects this within 24 hours.`,
    `Slightly low body water — aim for ${lo}% or above. Mild dehydration skews your body composition readings: fat appears higher than reality, muscle appears lower. It also reduces energy and slows recovery. Consistent hydration through the day (not just large amounts at once) corrects this quickly.`,
    `Body water is a little below ideal (${lo}% or above is the target). Even at this mild level, dehydration affects the accuracy of your body composition readings — fat reads higher, muscle reads lower. Drink more consistently through the day and the numbers will be sharper next time.`,
    `Slightly below optimal hydration (aim for ${lo}% or above). At this level, the bio-electrical readings used for body fat and muscle are slightly less accurate — dehydration makes fat appear higher and muscle appear lower than they actually are. More consistent fluid intake through the day addresses this quickly.`,
    `Body water is a bit low (target ${lo}% or above). Mild dehydration has a disproportionate effect on body composition readings — fat percentage reads higher, muscle reads lower. Drinking consistently through the day (rather than large amounts at once) brings this up quickly.`,
    `Slightly low on body water — below ${lo}%. Even mild dehydration of 1–2% measurably affects how body fat and muscle are read by bio-electrical measurement. The fix is simple: drink more consistently through the day and recheck. The other numbers will look better when hydration is optimal.`,
    `Body water is a little below the healthy threshold (${lo}%). This level of dehydration is enough to skew body composition readings — inflating fat percentage and deflating muscle readings. It also reduces energy and recovery. Consistent fluid intake through the day brings it up within 24 hours.`,
  ]))

  return range('attention', 'Low', pickDesc([
    `Body water is below the healthy threshold (aim for ${lo}% or above). At this level, dehydration measurably skews your body composition readings — fat appears higher, muscle lower. It also reduces energy, focus, and recovery. Rehydrate and remeasure for a more accurate picture.`,
    `Low body water — below the healthy threshold of ${lo}%. At this level of dehydration, the body composition readings here (fat %, muscle mass) are meaningfully less accurate: fat reads higher than reality, muscle reads lower. Rehydrate before your next measurement for a reliable picture.`,
    `Body water is below healthy levels (${lo}% or above is the target). Dehydration at this level skews every bio-electrical reading — fat appears higher, muscle appears lower than they actually are. It also impairs energy, focus, and recovery. Prioritise hydration and remeasure.`,
    `Below the healthy hydration threshold (${lo}%). At this level of dehydration, body fat % will appear higher than it actually is and muscle mass will read lower — the bio-electrical measurement TANITA uses is sensitive to fluid levels. Rehydrate consistently and the readings will be sharper next time.`,
    `Body water is low — below ${lo}%. This level of dehydration meaningfully affects the accuracy of the body composition readings on this page. Fat reads higher than reality, muscle lower. Beyond the readings, dehydration at this level reduces energy, cognitive function, and physical performance. Drink more.`,
    `Low body water is worth taking seriously. Below ${lo}%, dehydration skews body fat readings upward and muscle readings downward — which can make this page look worse than reality. It also affects energy, recovery, and physical performance. Rehydrate consistently before your next measurement.`,
    `Dehydrated — body water is below ${lo}%. This affects both your health and the accuracy of these readings: fat appears higher, muscle lower, when the body is short on fluid. Drink consistently through the day (not just a large amount at once), and remeasure when hydration is restored for a reliable baseline.`,
  ]))
}

// ── Resting calories ──────────────────────────────────────────────────────────
const ACTIVITY_MULT: Partial<Record<number, [number, string]>> = {
  1: [1.20,  'low activity'],
  2: [1.375, 'standard activity'],
  3: [1.55,  'moderate activity'],
  4: [1.725, 'high activity'],
  5: [1.90,  'athletic training'],
}

export function restingCaloriesRange(kcal: number, activityLevel?: number | null): HealthRange {
  const [mult, actLabel] = ACTIVITY_MULT[activityLevel ?? 2] ?? [1.375, 'standard activity']
  const daily = Math.round((kcal * mult) / 10) * 10
  return range('good', `~${daily} kcal/day`, pickDesc([
    `Your body burns ${kcal} kcal per day at complete rest — just to keep organs running, maintain temperature, and stay alive. With ${actLabel}, total daily burn is around ${daily} kcal. Resting burn is driven almost entirely by muscle mass: more muscle means a higher floor, making weight management easier over time.`,
    `Resting metabolic rate is ${kcal} kcal/day — the energy your body needs just to exist, with no movement at all. Add ${actLabel} and the total rises to around ${daily} kcal per day. Muscle mass is the primary driver of this number: building more muscle raises the resting burn, permanently lifting your daily calorie requirement.`,
    `Your body burns ${kcal} kcal per day at complete rest — organs, temperature, cellular repair, breathing. With ${actLabel} on top, that's around ${daily} kcal total per day. Resting calorie burn is largely determined by muscle mass: each additional kilogram of muscle adds roughly 13 kcal/day to your resting burn, compounding over time.`,
    `At complete rest, your body uses ${kcal} kcal per day to sustain all its basic functions. Factor in ${actLabel} and the total is approximately ${daily} kcal per day. This number is worth tracking because it's not fixed — building muscle raises it. More muscle means a permanently higher metabolic floor, making it easier to maintain or lose weight long-term.`,
    `Resting burn is ${kcal} kcal per day — the energy cost of just being alive. With ${actLabel}, total daily expenditure is around ${daily} kcal. Muscle mass drives this number: fat tissue burns about 4 kcal per kg per day at rest, while muscle burns around 13 kcal per kg. Building muscle doesn't just look different — it changes how much energy your body demands every day.`,
    `Your resting metabolic rate is ${kcal} kcal per day. This is what your body burns doing absolutely nothing — just maintaining organ function, body temperature, and basic cellular processes. Including ${actLabel}, total daily burn is around ${daily} kcal. This floor is almost entirely set by muscle mass — which is why building muscle is the best long-term metabolic investment.`,
    `${kcal} kcal per day is your resting metabolic rate — the baseline your body burns with no activity at all. With ${actLabel}, total daily expenditure is approximately ${daily} kcal. Resting burn is set by muscle mass more than anything else: each kilogram of muscle adds around 13 kcal/day to this number. A higher resting burn means more metabolic flexibility and easier long-term weight management.`,
  ]))
}
