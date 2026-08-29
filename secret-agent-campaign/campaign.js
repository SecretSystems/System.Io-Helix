(function(){
  "use strict";

  /* ── Network Directory menu ── */
  var directory = document.getElementById("sacDirectory");
  var openBtn = document.getElementById("sacDirectoryOpen");
  var openBtnCenter = document.getElementById("sacDirectoryOpenCenter");
  var closeBtn = document.getElementById("sacDirectoryClose");
  var lastFocused = null;

  function openDirectory(){
    lastFocused = document.activeElement;
    directory.classList.add("is-open");
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }
  function closeDirectory(){
    directory.classList.remove("is-open");
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if(lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  if(openBtn) openBtn.addEventListener("click", openDirectory);
  if(openBtnCenter) openBtnCenter.addEventListener("click", openDirectory);
  if(closeBtn) closeBtn.addEventListener("click", closeDirectory);

  directory.querySelectorAll("[data-close]").forEach(function(link){
    link.addEventListener("click", closeDirectory);
  });

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && directory.classList.contains("is-open")) closeDirectory();
  });

  /* simple focus trap while the directory is open */
  directory.addEventListener("keydown", function(e){
    if(e.key !== "Tab") return;
    var focusable = directory.querySelectorAll('a[href], button:not([disabled])');
    if(!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if(e.shiftKey && document.activeElement === first){
      e.preventDefault();
      last.focus();
    } else if(!e.shiftKey && document.activeElement === last){
      e.preventDefault();
      first.focus();
    }
  });

  /* ── Scroll reveal ── */
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".sac-reveal");
  if(reduced || !("IntersectionObserver" in window)){
    revealEls.forEach(function(el){ el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function(el){ observer.observe(el); });
  }

})();
