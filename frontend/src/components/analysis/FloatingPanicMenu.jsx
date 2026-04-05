import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPhoneAlt, FaShieldAlt, FaBell } from "react-icons/fa";

const menuActions = [
  { id: "call-help", label: "Call Emergency", icon: FaPhoneAlt },
  { id: "share-location", label: "Share Live Location", icon: FaShieldAlt },
  { id: "trigger-sos", label: "Trigger SOS", icon: FaBell },
];

function FloatingPanicMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-5 bottom-24 md:bottom-8 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            className="mb-3 space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
          >
            {menuActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ x: -4 }}
                  type="button"
                  className="w-full rounded-xl border border-rose-200/30 bg-rose-500/18 backdrop-blur-lg text-rose-100 px-4 py-2 text-sm font-semibold flex items-center justify-between gap-3"
                >
                  <span>{action.label}</span>
                  <Icon />
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="h-14 w-14 rounded-full panic-main-btn text-white shadow-2xl border border-rose-200/35"
        animate={{ boxShadow: ["0 0 0 0 rgba(244,63,94,0.45)", "0 0 0 14px rgba(244,63,94,0)"] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        whileTap={{ scale: 0.94 }}
      >
        <span className="sr-only">Toggle panic actions</span>
        <FaBell className="text-2xl mx-auto" />
      </motion.button>
    </div>
  );
}

export default FloatingPanicMenu;
