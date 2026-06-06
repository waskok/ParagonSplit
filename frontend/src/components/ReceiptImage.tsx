import { useEffect, useState } from "react";
import { fetchReceiptImageUrl } from "../services/receiptService";

type ReceiptImageProps = {
  token: string;
  receiptId: string;
  alt: string;
  className?: string;
};

function ReceiptImage({ token, receiptId, alt, className }: ReceiptImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      setError(false);
      setImageUrl(null);

      try {
        objectUrl = await fetchReceiptImageUrl(token, receiptId);
        if (!cancelled) {
          setImageUrl(objectUrl);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [token, receiptId]);

  if (error) {
    return <p className="mt-3 text-xs text-zinc-500">Nie udało się załadować zdjęcia paragonu.</p>;
  }

  if (!imageUrl) {
    return <p className="mt-3 text-xs text-zinc-500">Ładowanie zdjęcia...</p>;
  }

  return <img src={imageUrl} alt={alt} className={className} />;
}

export default ReceiptImage;
