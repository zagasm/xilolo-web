import React, { Fragment, useState, useEffect } from "react";
import zagasmLogo from "../../../assets/zagasm_studio_logo.png";
import "./style.css";
import { motion } from "framer-motion";

import { Link } from "react-router-dom";
function AuthContainer({
  title,
  description,
  type,
  children,
  footer,
  header,
  haveAccount,
  privacy,
  socialSlot,
}) {
  // const images = [slider1, slider2, slider3];
  // const [currentImage, setCurrentImage] = useState(0);
  // useEffect(() => {
  //     const interval = setInterval(() => {
  //         setCurrentImage((prev) => (prev + 1) % images.length);
  //     }, 4000); // Change image every 4 seconds
  //     return () => clearInterval(interval);
  // }, []);
  return (
    <Fragment>
      <div className="auth-background">
        <div className="bar_section">
          <div className="left_bar bar_container"></div>
          <div className="right_bar bar_container"></div>
        </div>
        {/* Main Content */}
        <div className="container-fluid position-relative auth_container mb-5">
          <div className="row justify-content-center align-items-center d-flex align-center  inner_form_con">
            {/* Width pinned inline: bootstrap's .col-lg-7 sets width:58% at 1024-1199px and
                outranks the stylesheet rule, which made the signup card sprawl across the
                page on laptop widths. Inline wins outright, so the card is the same
                sensible width at every breakpoint. */}
            <div
              className="form_container"
              style={{
                width: "100%",
                boxSizing: "border-box",
                // min() so the card can never exceed the viewport minus gutters —
                // a plain maxWidth:420 clipped the form on a 390px phone.
                maxWidth: "min(420px, calc(100vw - 32px))",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <div className="osahan-login ">
                <div className="text-center pr-4 pl-4">
                  <p
                    style={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Link to="/">
                      <img
                        src={"/logo.png"}
                        className="tw:w-32 tw:md:w-40"
                        alt="Xilolo Logo"
                      />
                    </Link>
                  </p>
                  {header && (
                    <div
                      className="heading_section d-block text-center"
                      style={{ marginBottom: "30px", boxShadow: "none" }}
                    >
                      <motion.h5
                        initial={{ opacity: 0, x: -70 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="font-weight-bold mt-3 container_heading_tex text-center "
                      >
                        {title}
                      </motion.h5>

                      <motion.p
                        initial={{ opacity: 0, x: 70 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="text-muted heading_content"
                      >
                        {description}
                      </motion.p>
                    </div>
                  )}
                </div>
                {children}
                {footer && socialSlot ? (
                  <div style={{ maxWidth: "100%" }} className="text-center mt-4">
                    {socialSlot}
                  </div>
                ) : null}
                {haveAccount ? (
                  <div className="text-center footer_text mt-4 ">
                    Don't have an account?{" "}
                    <Link to="/auth/signup" className="">
                      Sign up
                    </Link>
                  </div>
                ) : (
                  <div className="text-center mt-4 footer_text ">
                    Have an account?{" "}
                    <Link to="/auth/signin" className="">
                      Sign In
                    </Link>
                  </div>
                )}
                {privacy && (
                  <div className="text-center mt-3 footer_text">
                    By continuing, you agree to our{" "}
                    <Link
                      to="/terms-of-service"
                      className=""
                    >
                      Terms
                    </Link>
                    <span> and </span>
                    <Link to="/privacy-policy">
                      Privacy Policy
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
export default AuthContainer;
