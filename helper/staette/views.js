//imports
const util = require("../general/util");

//constants
const whoIsThereInputBlockName = "whoIsThereBlock";
const whoIsThereTimePickerName = "whoIsThereTimePicker";

const sectionUsers = 5;

//******************** Views ********************//
const whoIsThereMessage = {
  channel: process.env.STAETTE_CHANNEL,
  text: "", // Text in the notification, set in the method
  emoji: true,
  unfurl_links: false,
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "", //set in method
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "", //set in method
      },
    },
    {
      type: "section",
      block_id: whoIsThereInputBlockName,
      text: {
        type: "mrkdwn",
        text: "", //set in method
      },
      accessory: {
        type: "timepicker",
        initial_time: "17:00",
        placeholder: {
          type: "plain_text",
          text: "Zeit wählen",
          emoji: true,
        },
        action_id: whoIsThereTimePickerName,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          style: "primary",
          text: {
            type: "plain_text",
            text: "Abschicken",
            emoji: true,
          },
          value: "update",
          action_id: "action-whoisthere-update",
        },
        {
          type: "button",
          style: "danger",
          text: {
            type: "plain_text",
            text: "Meine Löschen",
            emoji: true,
          },
          value: "delete",
          action_id: "action-whoisthere-delete",
        },
      ],
    },
  ],
};

//******************** Functions ********************//
function getWhoIsThereMessage({ user_id, text }) {
  let view = JSON.parse(JSON.stringify(whoIsThereMessage));

  let day = text == `${util.formatDate(new Date())}` ? "heute" : `am ${text}`;

  view.blocks[0].text.text = `\`${text}\``;

  view.text =
    view.blocks[1].text.text = `<@${user_id}> will wissen wer ${day} in der Stätte ist`;

  view.blocks[2].text.text = `Wann bist du ${day} da?`;

  return view;
}

function updateWhoIsThereMessage({ user, time, xdelete }, { text, blocks }) {
  let view = JSON.parse(JSON.stringify(whoIsThereMessage));
  let users = [];

  view.blocks = blocks;
  view.text = text;

  if (view.blocks[sectionUsers]) {
    //get user list
    view.blocks[sectionUsers].text.text.split("\n").forEach((element) => {
      let userArr = element.split("\t");
      users.push({
        time: userArr[0],
        user: userArr[1],
      });
    });

    //get index of user
    let index = users.findIndex((element) => element.user == `<@${user}>`);

    //remove old element of user
    if (index != -1) users.splice(index, 1);

    //reset text
    view.blocks[sectionUsers].text.text = "";
  }

  //no time = delete: return view now
  if (xdelete) {
    users.forEach((element, index) => {
      view.blocks[sectionUsers].text.text = `${
        view.blocks[sectionUsers].text.text
      }${index > 0 ? "\n" : ""}${element.time}\t${element.user}`;
    });

    //if empty, delete section(s)
    if (users.length == 0 && view.blocks[sectionUsers])
      view.blocks.splice(sectionUsers - 1, 3);

    return view;
  }

  //add user
  users.push({ user: `<@${user}>`, time: time });

  //sort times
  users.sort((a, b) => {
    if (a.time > b.time) return 1;
    if (a.time < b.time) return -1;
    return 0;
  });

  //build view (replace old blocks)
  view.blocks.splice(
    //start
    sectionUsers - 1,
    //delete
    3,
    //adding objects
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "",
      },
    },
    {
      type: "divider",
    }
  );

  users.forEach((element, index) => {
    view.blocks[sectionUsers].text.text = `${
      view.blocks[sectionUsers].text.text
    }${index > 0 ? "\n" : ""}${element.time}\t${element.user}`;
  });

  return view;
}

//exports
module.exports = {
  getWhoIsThereMessage,
  updateWhoIsThereMessage,

  whoIsThereInputBlockName,
  whoIsThereTimePickerName,
};
