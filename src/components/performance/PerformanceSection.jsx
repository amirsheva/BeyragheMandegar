import Container from "../common/Container";

export default function PerformanceSection({children}) {
  return (
    <Container>
      <div className="space-y-6">
        {children}
      </div>
    </Container>
  );
}
