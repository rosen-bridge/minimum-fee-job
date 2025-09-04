import { useCallback, useEffect, useRef, useState } from "react";

import { MAX_CHUNK_SIZE, MIN_CHUNK_SIZE, QR_TYPE } from "../constants";

/**
 * get min and max page sizes for a tx
 */
const getPageThresholds = (tx: string) => {
  const txSize = tx.length;

  const min = Math.ceil(txSize / (MAX_CHUNK_SIZE - 10 - QR_TYPE.length));
  const max = Math.ceil(txSize / MIN_CHUNK_SIZE);

  return {
    min,
    max,
  };
};

/**
 * wrap all required Qr logic
 */
const useChunkedTx = (tx: string) => {
  const pageThresholds = getPageThresholds(tx);

  const [pagesCount, setPagesCount] = useState(pageThresholds.min);
  const [pageIndex, setPageIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const interval = useRef<number>();

  useEffect(() => {
    setPagesCount(pageThresholds.min);
  }, [pageThresholds.min]);

  const chunkSize = Math.ceil(tx.length / pagesCount);

  const handleSliderChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      setPagesCount(newValue as number);
      setPageIndex(0);
    },
    []
  );

  const chunk = tx.substring(
    pageIndex * chunkSize,
    (pageIndex + 1) * chunkSize
  );

  const value = JSON.stringify({
    [QR_TYPE]: chunk,
    p: pageIndex + 1,
    n: pagesCount,
    a: playing ? 1 : 0,
  });

  const clone = () => {
    return JSON.stringify({ [QR_TYPE]: tx });
  }

  const play = () => {
    clearInterval(interval.current);

    setPlaying(!playing);

    if (playing) return;

    setPageIndex(0);

    interval.current = window.setInterval(() => {
      setPageIndex((index) => {
        if (index + 1 > pagesCount - 1) return 0;
        return (index + 1)
      });
    }, 800);
  }

  useEffect(() => {
    return () => {
      clearInterval(interval.current);
    };
  }, []);

  return {
    setIndex: setPageIndex,
    handleSliderChange,
    pageIndex,
    pagesCount,
    pageThresholds,
    value,
    playing,
    clone,
    play,
  };
};

export default useChunkedTx;
