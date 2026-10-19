import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.useDeviceLanguage();

const form = document.getElementById("customer-login-form");
const phoneInput = document.getElementById("phone");
const otpInput = document.getElementById("otp-code");
const otpRow = document.getElementById("otp-row");
const authButton = document.getElementById("auth-button");
const changeNumberButton = document.getElementById("change-number-button");
const authStatusTitle = document.getElementById("auth-status-title");
const authStatusCopy = document.getElementById("auth-status-copy");
const recaptchaContainer = document.getElementById("recaptcha-container");

let confirmationResult = null;
let recaptchaVerifier = null;
let busy = false;

function setStatus(title, copy, kind = "info") {
  authStatusTitle.textContent = title;
  authStatusCopy.textContent = copy;
  const box = document.getElementById("auth-status");
  box.dataset.kind = kind;
  box.style.borderColor = kind === "error" ? "#e7b6b0" : kind === "success" ? "#b8dfc0" : "#f4d7b8";
  box.style.background = kind === "error" ? "#fff1ef" : kind === "success" ? "#f0fff3" : "#fff8ee";
}

function setBusy(value) {
  busy = value;
  authButton.disabled = value;
  changeNumberButton.disabled = value || Boolean(auth.currentUser);
  authButton.style.cursor = value ? "wait" : "pointer";
  authButton.style.background = value ? "#e8e1da" : "linear-gradient(135deg,#ff9b36,#ff7900)";
  authButton.style.color = value ? "#81766d" : "#fff";
}

function clearRecaptcha() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  recaptchaContainer.replaceChildren();
}

function setupRecaptcha() {
  if (recaptchaVerifier) return Promise.resolve();
  recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
    size: "normal",
    callback: () => {},
    "expired-callback": () => {
      setStatus("Verification expired", "Please complete the reCAPTCHA again before requesting an OTP.", "error");
    }
  });
  return recaptchaVerifier.render();
}

function friendlyError(error) {
  const code = error?.code || "";
  if (code === "auth/invalid-phone-number") return "Enter a valid 10-digit Indian mobile number.";
  if (code === "auth/too-many-requests") return "Too many attempts. Please wait and try again later.";
  if (code === "auth/quota-exceeded") return "SMS quota has been reached for this Firebase project. Try later or configure billing/limits.";
  if (code === "auth/captcha-check-failed") return "reCAPTCHA verification failed. Check the website's authorized domain and try again.";
  if (code === "auth/unauthorized-domain") return "This website domain is not authorized in Firebase Authentication settings.";
  if (code === "auth/operation-not-allowed") return "Phone sign-in is not enabled. Enable Phone in Firebase Authentication → Sign-in method.";
  if (code === "auth/invalid-verification-code") return "That OTP is incorrect. Check the code and try again.";
  if (code === "auth/code-expired") return "That OTP has expired. Request a new OTP.";
  if (code === "auth/network-request-failed") return "Network problem. Check your internet connection and try again.";
  return "Firebase could not complete sign-in. Check Phone Authentication, authorized domains, reCAPTCHA, and Firebase console settings, then try again.";
}

async function sendOtp() {
  const digits = phoneInput.value.replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(digits)) {
    phoneInput.setCustomValidity("Enter a valid 10-digit Indian mobile number.");
    phoneInput.reportValidity();
    phoneInput.setCustomValidity("");
    return;
  }
  setBusy(true);
  try {
    await setupRecaptcha();
    confirmationResult = await signInWithPhoneNumber(auth, "+91" + digits, recaptchaVerifier);
    phoneInput.disabled = true;
    changeNumberButton.hidden = false;
    otpRow.hidden = false;
    otpInput.required = true;
    otpInput.focus();
    authButton.textContent = "Verify OTP";
    setStatus("OTP sent", "Enter the verification code sent to +91 " + digits + ". Never share your OTP with anyone.", "success");
  } catch (error) {
    setStatus("Could not send OTP", friendlyError(error), "error");
    clearRecaptcha();
  } finally {
    setBusy(false);
  }
}

async function verifyOtp() {
  const code = otpInput.value.trim();
  if (!/^\d{6}$/.test(code)) {
    otpInput.setCustomValidity("Enter the 6-digit OTP.");
    otpInput.reportValidity();
    otpInput.setCustomValidity("");
    return;
  }
  setBusy(true);
  try {
    const credential = await confirmationResult.confirm(code);
    const phone = credential.user.phoneNumber || "your verified mobile number";
    otpRow.hidden = true;
    otpInput.required = false;
    changeNumberButton.hidden = true;
    phoneInput.disabled = true;
    authButton.textContent = "Sign out";
    authButton.disabled = false;
    authButton.style.cursor = "pointer";
    authButton.style.background = "linear-gradient(135deg,#ff9b36,#ff7900)";
    authButton.style.color = "#fff";
    setStatus(
      "Phone verified — signed in",
      "Your Firebase phone sign-in succeeded (" + phone + "). Customer profile saving, dog details, and bookings are not connected yet; no booking has been created.",
      "success"
    );
    document.getElementById("profile-next-step").hidden = false;
  } catch (error) {
    setStatus("OTP verification failed", friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
}

function restartWithDifferentNumber() {
  if (busy || auth.currentUser || !confirmationResult) return;
  confirmationResult = null;
  otpInput.value = "";
  otpInput.required = false;
  otpRow.hidden = true;
  phoneInput.disabled = false;
  changeNumberButton.hidden = true;
  authButton.textContent = "Send OTP";
  clearRecaptcha();
  setStatus(
    "Change mobile number",
    "Enter the correct 10-digit number, then request a new OTP. The previous verification attempt has been reset.",
    "info"
  );
  phoneInput.focus();
}

changeNumberButton.addEventListener("click", restartWithDifferentNumber);

form.addEventListener("submit", event => event.preventDefault());
authButton.addEventListener("click", async () => {
  if (busy) return;
  if (auth.currentUser) {
    setBusy(true);
    try {
      await signOut(auth);
      clearRecaptcha();
      setStatus("Signed out", "You have safely signed out of DOJO WALK.", "success");
    } catch (error) {
      setStatus("Could not sign out", friendlyError(error), "error");
    } finally {
      setBusy(false);
    }
    return;
  }
  if (confirmationResult) await verifyOtp();
  else await sendOtp();
});

onAuthStateChanged(auth, user => {
  if (!user) {
    if (!busy) clearRecaptcha();
    phoneInput.disabled = false;
    changeNumberButton.hidden = true;
    changeNumberButton.disabled = false;
    otpRow.hidden = true;
    otpInput.required = false;
    otpInput.value = "";
    phoneInput.value = "";
    confirmationResult = null;
    authButton.textContent = "Send OTP";
    authButton.disabled = false;
    authButton.style.cursor = "pointer";
    authButton.style.background = "linear-gradient(135deg,#ff9b36,#ff7900)";
    authButton.style.color = "#fff";
    document.getElementById("profile-next-step").hidden = true;
    return;
  }
  phoneInput.disabled = true;
  changeNumberButton.hidden = true;
  changeNumberButton.disabled = false;
  otpRow.hidden = true;
  authButton.textContent = "Sign out";
  authButton.disabled = false;
  authButton.style.cursor = "pointer";
  authButton.style.background = "linear-gradient(135deg,#ff9b36,#ff7900)";
  authButton.style.color = "#fff";
  setStatus("Signed in to Firebase", "Phone authentication is active. Continue to your customer profile to view or save your personal details. Dog details and bookings are not connected yet.", "success");
  document.getElementById("profile-next-step").hidden = false;
});
