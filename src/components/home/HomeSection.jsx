import SectionWrapper from "../common/SectionWrapper";
import Container from "../common/Container";

export default function HomeSection({children}) {
  return (
    <SectionWrapper>
      <Container>
        {children}
      </Container>
    </SectionWrapper>
  );
}
