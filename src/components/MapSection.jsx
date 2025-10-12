export default function MapSection() {
  return (
    <div className="card h-[360px]">
      <iframe
        title="map"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12629.931866149478!2d51.3890394!3d35.6891987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3f8c1f2e1f084edb%3A0x1a1fa5d3a1da23bc!2z2LfZhti32qHZg9in2KzY!5e0!3m2!1sen!2s!4v1668381447447!5m2!1sen!2s"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
}
