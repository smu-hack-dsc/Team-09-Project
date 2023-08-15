const daysTag = document.querySelector(".days"),
  currentDate = document.querySelector(".current-date"),
  prevNextIcon = document.querySelectorAll(".icons span"),
  calendarInputStart = document.querySelector("#calendar_input_start"),
  calendarInputEnd = document.querySelector("#calendar_input_end"),
  calendarWrapper = document.querySelector(".wrapper");

let date = new Date(),
  currYear = date.getFullYear(),
  currMonth = date.getMonth();

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const renderCalendar = () => {
  let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(),
    lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(),
    lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay(),
    lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate();
  let liTag = "";

  for (let i = firstDayofMonth; i > 0; i--) {
    liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
  }

  for (let i = 1; i <= lastDateofMonth; i++) {
    let isToday =
      i === date.getDate() &&
      currMonth === new Date().getMonth() &&
      currYear === new Date().getFullYear()
        ? "active"
        : "";
    liTag += `<li class="${isToday}">${i}</li>`;
  }

  for (let i = lastDayofMonth; i < 6; i++) {
    liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`;
  }
  currentDate.innerText = `${months[currMonth]} ${currYear}`;
  daysTag.innerHTML = liTag;
};

renderCalendar();

prevNextIcon.forEach((icon) => {
  icon.addEventListener("click", () => {
    currMonth = icon.id === "prev" ? currMonth - 1 : currMonth + 1;

    if (currMonth < 0 || currMonth > 11) {
      date = new Date(currYear, currMonth, new Date().getDate());
      currYear = date.getFullYear();
      currMonth = date.getMonth();
    } else {
      date = new Date();
    }
    renderCalendar();
  });
});

const calendarInputs = [calendarInputStart, calendarInputEnd];

calendarInputs.forEach((input) => {
  input.addEventListener("click", () => {
    calendarWrapper.style.display = "block";
  });
});

daysTag.addEventListener("click", (e) => {
  const selectedDate = e.target.innerText;

  if (selectedDate) {
    const formattedDate = `${selectedDate} ${months[currMonth]} ${currYear}`;
    const activeInput = calendarInputs.find((input) => input === document.activeElement);

    if (activeInput) {
      activeInput.value = formattedDate;
      calendarWrapper.style.display = "none";
    }
  }
});

document.addEventListener("click", (e) => {
  if (!calendarWrapper.contains(e.target) && !calendarInputs.includes(e.target)) {
    calendarWrapper.style.display = "none";
  }
});
