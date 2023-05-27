import React, { useState, useEffect } from "react";
import ConnectWalletButton from "./ConnectWalletButton/ConnectWalletButton";
import BidModal from "./Modals/BidModal/BidModal";
import UserProfile from "./UserProfile/UserProfile";
import { useAccount, default as wagmi } from "wagmi";
import { useSignMessage, useNetwork, useDisconnect } from "wagmi";
import { SiweMessage } from "siwe";
import axios from "axios";

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

function SignInButton({ onSuccess, onError }) {
  const [state, setState] = useState({});

  const { address } = useAccount();
  const { chain } = useNetwork();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const fetchNonce = async () => {
    try {
      const nonceRes = await fetch("/api/nonce");
      const nonce = await nonceRes.text();
      setState((prevState) => ({ ...prevState, nonce }));
    } catch (error) {
      setState((prevState) => ({ ...prevState, error }));
    }
  };

  useEffect(() => {
    fetchNonce();
  }, []);

  let signInMsg = `Sign in to use EsthesticOptics

This request will not trigger a blockchain transaction or cost any gas fees.Your authentication status will reset after 24 hours
`;

  const signIn = async () => {
    try {
      const chainId = chain?.id;
      if (!address || !chainId) return;

      setState((prevState) => ({ ...prevState, loading: true }));
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: signInMsg,
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: state.nonce,
      });
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      const verifyRes = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, signature }),
      });
      if (!verifyRes.ok) throw new Error("Error verifying message");

      setState((prevState) => ({ ...prevState, loading: false }));
      onSuccess({ address });
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        loading: false,
        nonce: undefined,
      }));
      onError({ error });
      fetchNonce();
    }
  };

  const signOut = async () => {
    await fetch("/api/logout");
    setState({});
  };

  const handleClose = () => {
    signOut();
    disconnect();
    setShow(false);
  };
  const handleShow = () => setShow(true);

  return (
    <button
      disabled={!state.nonce || state.loading}
      onClick={signIn}
      className="sc-button ml-5 style-2"
    >
      <span>Accept/Sign in</span>
    </button>
  );
}

const Header = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [show, setShow] = useState(false);
  const [state, setState] = useState({});
  const { disconnect } = useDisconnect();

  const signOut = async () => {
    await fetch("/api/logout");
    setState({});
  };

  const handleClose = () => {
    signOut();
    disconnect();
    setShow(false);
  };
  const handleShow = () => setShow(true);

  const {
    address,
    isConnected: isConnectedInit,
    isDisconnected,
  } = useAccount();
  const [isConnected, setIsConnected] = useState(null);

  useEffect(() => {
    if (isConnectedInit !== null) {
      setIsConnected(isConnectedInit);
      if (isConnectedInit) {
        handleShow();
      }
    }
  }, [isConnectedInit]);

  useEffect(() => {
    if (state.address) {
      setShow(false);
      // Make a GET request to check if the user exists
      axios
        .get(`/api/users?wallet=${state.address}`)
        .then((response) => {
          console.log("User exists:", response.data);
        })
        .catch((error) => {
          // If the user does not exist, make a POST request to create the user
          if (error.response.status === 404) {
            axios
              .post(`/api/users`, { wallet: state.address })
              .then((response) => {
                console.log("User created:", response.data);
              })
              .catch((error) => {
                console.error("Error creating user:", error);
              });
          } else {
            console.error("Error fetching user:", error);
          }
        });
    }
  }, [state.address]);

  useEffect(() => {
    if (state.error) {
      handleClose();
    }
  }, [, state.error]);

  useEffect(() => {
    // Check if window is defined (i.e. we're in a browser)
    if (typeof window !== "undefined") {
      const handleResize = () => setIsMobile(window.innerWidth <= 991);
      window.addEventListener("resize", handleResize);
      // Call handler right away so state gets updated with initial window size
      handleResize();

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []); // Empty array ensures that effect is only run on mount and unmount

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isDarkMode) {
        document.body.classList.add("is_dark");
      } else {
        document.body.classList.remove("is_dark");
      }
    }
  }, [isDarkMode]);

  const handleDarkModeClick = (event) => {
    event.preventDefault();
    setIsDarkMode(!isDarkMode);
  };

  const handleNavClick = () => {
    setIsNavOpen(!isNavOpen);
  };
  return (
    <>
      <header id="header_main" className="header_1 js-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="mobile-button" onClick={handleNavClick}>
                <span></span>
              </div>
              <div id="site-header-inner" className="flex">
                <div id="site-logo" className="clearfix">
                  <div id="site-logo-inner">
                    <a href="/" rel="home" className="main-logo">
                      <img
                        id="logo_header"
                        src="assets/images/logo/logo_dark.png"
                        alt="nft-gaming"
                        width="151"
                        height="45"
                        data-retina="assets/images/logo/logo_dark@2x.png"
                        data-width="151"
                        data-height="45"
                      />
                    </a>
                  </div>
                </div>
                <form className="form-search">
                  <input
                    type="text"
                    placeholder="Search here"
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <button>
                    <i className="far fa-search"></i>
                  </button>
                </form>
                <div id="site-menu">
                  <nav
                    id="main-nav"
                    className="main-nav"
                    style={
                      isMobile ? { display: "none" } : { display: "block" }
                    }
                  >
                    {!isMobile && !isNavOpen && (
                      <ul id="menu-primary-menu" className="menu">
                        <li className="menu-item">
                          <a href="/">Home</a>
                        </li>
                        <li className="menu-item">
                          <a href="explore">Explore</a>
                        </li>

                        <li className="menu-item menu-item-has-children">
                          <a href="#">Community</a>
                          <ul className="sub-menu">
                            <li className="menu-item">
                              <a href="/authors">Authors</a>
                            </li>
                            <li className="menu-item">
                              <a href="/faqs">FAQs</a>
                            </li>
                            <li className="menu-item">
                              <a href="/contact">Contact</a>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    )}
                  </nav>
                </div>
                {isConnected !== null &&
                  (isConnected ? <UserProfile /> : <ConnectWalletButton />)}

                <div className="mode_switcher">
                  <a
                    href="#"
                    className="mode-toggle d-flex align-items-center"
                    style={{ paddingRight: "2px" }}
                    onClick={handleDarkModeClick}
                  >
                    <img
                      src={
                        isDarkMode
                          ? "assets/images/icon/moon.png"
                          : "assets/images/icon/sun.png"
                      }
                      alt=""
                    />
                  </a>
                  <h6 style={{ paddingLeft: "2px" }}>
                    <span>Dark Mode</span>{" "}
                    <strong>{isDarkMode ? "Deactivate" : "Activate"}</strong>
                  </h6>
                </div>

                <nav
                  id="main-nav-mobi"
                  className="main-nav"
                  style={isNavOpen ? { display: "block" } : { display: "none" }}
                >
                  {isMobile && isNavOpen && (
                    <ul id="menu-primary-menu" className="menu">
                      <li className="menu-item">
                        <a href="/">Home</a>
                      </li>
                      <li className="menu-item">
                        <a href="explore.php">Explore</a>
                      </li>

                      <li className="menu-item menu-item-has-children">
                        <a href="#">Community</a>
                        <ul className="sub-menu">
                          <li className="menu-item">
                            <a href="blog.html">Blog</a>
                          </li>
                          <li className="menu-item">
                            <a href="blog-details.html">FAQs</a>
                          </li>
                          <li className="menu-item">
                            <a href="contact.html">Contact</a>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>
      <Modal
        backdrop="static"
        centered
        className="modal fade popup"
        show={show}
        onHide={handleClose}
      >
        <Modal.Body className="m-5 pt-5">
          <div className="text-center mt-5 pt-2">
            <a href="/" rel="home" className="main-logo">
              <img
                id="logo_header"
                src="assets/images/logo/logo_dark.png"
                alt="nft-gaming"
                width="100%"
                height="100%"
                data-retina="assets/images/logo/logo_dark@2x.png"
                data-width="200px"
                data-height="450px"
              />
            </a>
          </div>
          <h4 className="text-center my-3" style={{ fontSize: "30px" }}>
            Welcome to Esthestic Optics
          </h4>
          <p className="text-center px-4 py-2" style={{ lineHeight: "15px" }}>
            By connectiong your wallet and using EsthesticOptics, you agree to
            our terms of service and Privacy Policy
          </p>
          <div className="card-bottom  text-center">
            <button className="sc-button style-2" onClick={() => handleClose()}>
              <span>Cancel</span>
            </button>
            <SignInButton
              onSuccess={({ address }) =>
                setState((prevState) => ({ ...prevState, address }))
              }
              onError={({ error }) =>
                setState((prevState) => ({ ...prevState, error }))
              }
            />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Header;