export default function ScanFailedPage() {
  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="text-center">
        <h1 className="text-xl font-bold text-red-600">Scan Failed</h1>
        <p className="text-muted-foreground mt-2">
          Something went wrong during the scan. Please try again later.
        </p>
      </div>
    </div>
  );
}
