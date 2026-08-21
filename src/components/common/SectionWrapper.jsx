export default function SectionWrapper({children, className=""}) {
  return (
    <section className={`py-10 ${className}`}>
      {children}
    </section>
  );
}
