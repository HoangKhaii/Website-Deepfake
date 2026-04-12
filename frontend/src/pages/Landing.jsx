import { useState } from "react";
import { useNotification } from "../components/Notification";
import { showcaseTabs, infoHubTabs, actionTabs } from "./landing/landingData";
import { useLandingDetection } from "./landing/useLandingDetection";
import LandingDecorBackground from "./landing/LandingDecorBackground";
import LandingNav from "./landing/LandingNav";
import LandingHero from "./landing/LandingHero";
import LandingShowcaseSection from "./landing/LandingShowcaseSection";
import LandingInfoHubSection from "./landing/LandingInfoHubSection";
import LandingActionSection from "./landing/LandingActionSection";
import LandingFooter from "./landing/LandingFooter";

export default function Landing() {
  const { success } = useNotification();
  const {
    user,
    logout,
    file,
    previewUrl,
    loading,
    result,
    error,
    expandedScoreDetails,
    setExpandedScoreDetails,
    visualSignals,
    handleFileChange,
    handleCheck,
    resetCheck,
  } = useLandingDetection();

  const [activeShowcase, setActiveShowcase] = useState("features");
  const [activeInfoHub, setActiveInfoHub] = useState("faq");
  const [activeActionTab, setActiveActionTab] = useState("pricing");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [contactSending, setContactSending] = useState(false);

  const showcaseOrder = showcaseTabs.map((tab) => tab.key);
  const activeShowcaseIdx = showcaseOrder.indexOf(activeShowcase);
  const goShowcase = (direction) => {
    const nextIdx =
      (activeShowcaseIdx + direction + showcaseOrder.length) % showcaseOrder.length;
    setActiveShowcase(showcaseOrder[nextIdx]);
  };

  const infoHubOrder = infoHubTabs.map((tab) => tab.key);
  const activeInfoHubIdx = infoHubOrder.indexOf(activeInfoHub);
  const goInfoHub = (direction) => {
    const nextIdx =
      (activeInfoHubIdx + direction + infoHubOrder.length) % infoHubOrder.length;
    setActiveInfoHub(infoHubOrder[nextIdx]);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setContactSending(true);
    window.setTimeout(() => {
      setContactSending(false);
      success("Got it — we'll read this and get back to you, usually within a day.");
      form.reset();
    }, 500);
  };

  const activeActionIdx = actionTabs.findIndex((tab) => tab.key === activeActionTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900 font-sans">
      <LandingDecorBackground />
      <LandingNav user={user} logout={logout} />
      <div className="overflow-x-hidden">
        <LandingHero
          user={user}
          file={file}
          previewUrl={previewUrl}
          loading={loading}
          result={result}
          error={error}
          visualSignals={visualSignals}
          expandedScoreDetails={expandedScoreDetails}
          setExpandedScoreDetails={setExpandedScoreDetails}
          handleFileChange={handleFileChange}
          handleCheck={handleCheck}
          resetCheck={resetCheck}
        />
        {!user && (
          <>
            <LandingShowcaseSection
              activeShowcase={activeShowcase}
              setActiveShowcase={setActiveShowcase}
              activeShowcaseIdx={activeShowcaseIdx}
              goShowcase={goShowcase}
            />
            <LandingInfoHubSection
              activeInfoHub={activeInfoHub}
              setActiveInfoHub={setActiveInfoHub}
              activeInfoHubIdx={activeInfoHubIdx}
              goInfoHub={goInfoHub}
              openFaqIndex={openFaqIndex}
              setOpenFaqIndex={setOpenFaqIndex}
            />
            <LandingActionSection
              user={user}
              activeActionTab={activeActionTab}
              setActiveActionTab={setActiveActionTab}
              activeActionIdx={activeActionIdx}
              contactSending={contactSending}
              handleContactSubmit={handleContactSubmit}
            />
            <LandingFooter />
          </>
        )}
      </div>
    </div>
  );
}
