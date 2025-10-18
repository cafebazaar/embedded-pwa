import { useEffect, useState } from "react";

const PACKAGE_NAME = "YOUR_PACKAGE_NAME_HERE";
const API_SECRET = "YOUR_API_SECRET_HERE";
const SKU = "YOUR_SKU_HERE";
const DEALER_PACKAGE_NAME = "YOUR_DEALER_PACKAGE_NAME_HERE";
const REDIRECT_URL = "YOUR_PWA_URL_HERE";

declare const Bazaar: {
  getAccountId: (value: string) => string;
  back: () => void;
};

function App() {
  const [visitedTime, setVisitedTime] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null | undefined>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const getAccountId = () => {
    if (typeof Bazaar !== "undefined") {
      const newAccountId = Bazaar?.getAccountId(PACKAGE_NAME);
      if (newAccountId) {
        return newAccountId;
      } else return null;
    }
  };

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };
    const setCookie = (name: string, value: string, days = 365) => {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${value}; expires=${expires}; path=/`;
    };
    const visited = getCookie("visitedTime");
    if (visited) {
      const newVisitedTime = parseInt(visited) + 1;
      setVisitedTime(newVisitedTime);
      setCookie("visitedTime", newVisitedTime.toString());
    } else {
      setVisitedTime(1);
      setCookie("visitedTime", "1");
    }

    const newAccountID = getAccountId();
    if (newAccountID) {
      setAccountId(newAccountID);
    }

    const handleNavigation = () => {
      if (typeof Bazaar !== "undefined") {
        Bazaar.back();
      }
    };
    window.addEventListener("popstate", handleNavigation, true);
  }, []);

  async function paymentConsuming() {
    const url = `https://pardakht.cafebazaar.ir/devapi/v2/api/consume/${PACKAGE_NAME}/purchases/`;
    const params = {
      token: token,
    };
    const options = {
      method: "POST",
      headers: {
        "CAFEBAZAAR-PISHKHAN-API-SECRET": API_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    };
    await fetch(`${url}`, options).then(function (response) {
      console.log(response.status);
      if (response.ok) {
        setStatus("200");
      }
      return response.json();
    });
  }

  useEffect(() => {
    if (token) {
      paymentConsuming();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openLoginDeepLink = (payment: boolean = false) => {
    const redirectUrl = `${REDIRECT_URL}?status=${
      payment ? "payment" : "login"
    }&sku=${SKU}`;
    window.location.replace(
      `bazaar://inapplogin?redirectUrl=${redirectUrl}}&packageName=${PACKAGE_NAME}&permissionScope=1`
    );
  };

  const openPaymentDeepLink = () => {
    if (accountId) {
      window.location.replace(
        `bazaar://in_app?redirectUrl=${REDIRECT_URL}&sku=${SKU}&dealerPackageName=${DEALER_PACKAGE_NAME}`
      );
    } else {
      openLoginDeepLink(true);
    }
  };

  const checkAccountId = () => {
    const newAccountID = getAccountId();
    if (newAccountID) {
      setAccountId(newAccountID);
    }
  };

  const copy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      alert("Copied the token: " + token);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const queryResponse = params.get("response");
    setResult(queryResponse);

    const queryToken = params.get("purchaseToken");
    setToken(queryToken);

    const queryLogin = params.get("status");

    const querySku = params.get("sku");

    if (queryLogin === "payment" && queryResponse === "ok") {
      window.location.replace(
        `bazaar://in_app?redirectUrl=${REDIRECT_URL}&sku=${querySku}&dealerPackageName=${DEALER_PACKAGE_NAME}`
      );
    }
  }, []);

  return (
    <>
      <span>visit:{visitedTime}</span>
      {result && <span>result query:{result}</span>}
      {status && <span>status code:{result}</span>}
      {token && (
        <div className="token">
          <span>token query</span>
          <span onClick={copy}>{token}</span>
        </div>
      )}
      {result && <button onClick={checkAccountId}>check account id</button>}
      {<span>accountId:{accountId || "there is no accountId"}</span>}
      {!accountId && (
        <button onClick={() => openLoginDeepLink()}>open login link</button>
      )}
      <button onClick={openPaymentDeepLink}>open payment link</button>
    </>
  );
}

export default App;
