import { motion } from "framer-motion";

export default function ScrollReveal({children}) {
  return (
    <motion.div
      initial={{opacity:0, y:20}}
      whileInView={{opacity:1, y:0}}
      viewport={{once:true}}
    >
      {children}
    </motion.div>
  );
}
