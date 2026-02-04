import { CreatePlanForm } from "./create-plan-form";

export default function NewPlanPage() {
  return (
    <main className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">새 라이딩 계획</h1>
        <p className="text-muted-foreground">
          새로운 라이딩 계획을 생성합니다. 출발지와 도착지를 선택해주세요.
        </p>
      </div>

      <CreatePlanForm />
    </main>
  );
}
