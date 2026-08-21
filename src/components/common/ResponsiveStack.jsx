export default function ResponsiveStack({children}) {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {children}
    </div>
  );
}
