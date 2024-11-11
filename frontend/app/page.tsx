import { Suspense } from "react";
import { unstable_noStore as noStore } from 'next/cache';

import Qr from "./_components/qrcode/Qr";
import Validations from "./Validations";
import { Box, CircularProgress } from "@mui/material";

const Home = () => {
  noStore();
  return (
    <main className="flex flex-row items-center justify-center h-screen gap-16">
      <div className="border-2 border-solid border-slate-300 shadow-xl rounded-2xl w-[60vw] min-h-[380px] max-h-[80vh]">
        <Suspense
          fallback={
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minHeight={380}
            >
              Loading validations &nbsp;
              <CircularProgress size={12} />
            </Box>
          }
        >
          <Validations />
        </Suspense>
      </div>
      <div className="border-2 border-solid border-slate-300 shadow-xl rounded-2xl w-[380px] min-h-[380px]">
        <Suspense
          fallback={
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minHeight={380}
            >
              Loading tx &nbsp;
              <CircularProgress size={12} />
            </Box>
          }
        >
          <Qr />
        </Suspense>
      </div>
    </main>
  );
};

export default Home;
