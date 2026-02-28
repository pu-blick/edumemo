export const PLAN_LIMITS = {
  free:   { maxClasses: 1,  maxStudentsPerClass: 3  },
  tester: { maxClasses: 5,  maxStudentsPerClass: 40 },
  pro:    { maxClasses: 5,  maxStudentsPerClass: 40 },
  plus:   { maxClasses: 15, maxStudentsPerClass: 40 },
  school: { maxClasses: 15, maxStudentsPerClass: 40 },
} as const;

type PlanKey = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string | null | undefined) {
  return PLAN_LIMITS[(plan as PlanKey) in PLAN_LIMITS ? (plan as PlanKey) : 'free'];
}
