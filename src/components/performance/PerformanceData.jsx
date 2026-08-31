import { useEffect, useState } from "react";
import { getShows } from "../../lib/api";

export default function PerformanceData({id, children}) {
  const [show, setShow] = useState(null);

  useEffect(() => {
    getShows()
      .then(items => {
        const item = items.find(x => String(x.id) === String(id));
        setShow(item || null);
      })
      .catch(() => setShow(null));
  }, [id]);

  return children(show);
}
