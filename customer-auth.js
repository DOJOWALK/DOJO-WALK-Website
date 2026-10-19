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
const existingButton = document.getElementById("existing-user");
const newButton = document.getElementById("new-user");
const accountHint = document.getElementById("account-hint");
const authStatusTitle = document.getElementById("auth-status-title");
const authStatusCopy = document.getElementById("auth-status-copy");
const recaptchaContainer = document.getElementById("recaptcha-container");

let isNewUser = false;
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
    phoneInput.disabled = true;
    authButton.textContent = "Sign out";
    authButton.disabled = false;
    authButton.style.cursor = "pointer";
    authButton.style.background = "linear-gradient(135deg,#ff9b36,#ff7900)";
    authButton.style.color = "#fff";
    setStatus(
      isNewUser ? "Phone verified — next: customer profile" : "Phone verified — signed in",
      "Your Firebase phone sign-in succeeded (" + phone + "). Continue to your customer profile to save your personal details. Dog details and bookings are not connected yet; no booking has been created.",
      "success"
    );
    document.getElementById("profile-next-step").hidden = false;
  } catch (error) {
    setStatus("OTP verification failed", friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
}

form.addEventListener("submit", event => event.preventDefault());
authButton.addEventListener("click", async () => {
  if (busy) return;
  if (auth.currentUser) {
    setBusy(true);
    try {
      await signOut(auth);
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

function selectAccountType(newUser) {
  if (confirmationResult || auth.currentUser) return;
  isNewUser = newUser;
  existingButton.setAttribute("aria-pressed", String(!newUser));
  newButton.setAttribute("aria-pressed", String(newUser));
  accountHint.textContent = newUser
    ? "Verify your mobile number first. Customer profile creation will be the next setup step."
    : "Verify your mobile number to sign in. Your pet profile and bookings are not yet connected to this website.";
  document.getElementById("login-title").textContent = newUser ? "Create customer account" : "Customer login";
  authButton.textContent = "Send OTP";
  setStatus("Ready for phone verification", "Firebase Phone Authentication must be enabled and this deployed website domain must be authorized in Firebase.", "info");
}

existingButton.addEventListener("click", () => selectAccountType(false));
newButton.addEventListener("click", () => selectAccountType(true));

onAuthStateChanged(auth, user => {
  if (!user) {
    phoneInput.disabled = false;
    existingButton.disabled = false;
    newButton.disabled = false;
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
  existingButton.disabled = true;
  newButton.disabled = true;
  otpRow.hidden = true;
  authButton.textContent = "Sign out";
  authButton.disabled = false;
  authButton.style.cursor = "pointer";
  authButton.style.background = "linear-gradient(135deg,#ff9b36,#ff7900)";
  authButton.style.color = "#fff";
  setStatus("Signed in to Firebase", "Phone authentication is active for this session. Customer profile saving and booking access still need to be implemented.", "success");
  document.getElementById("profile-next-step").hidden = false;
});
