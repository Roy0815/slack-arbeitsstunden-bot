// local references
const sheet = require("./sheet");
const util = require("../general/util");
const views = require("../general/views");

// constants
const registerViewName = "registerview";
const registerBlockNameSelect = "name_select_block";
const registerActionNameSelect = "name_select";

const maintainHoursViewName = "maintainhours";
const maintainHoursBlockDescription = "description_block";
const autoregisterInputBlock = "autoregisterinput_block";
const maintainHoursActionDescription = "description";
const maintainHoursBlockDate = "date_block";
const maintainHoursActionDate = "date";
const maintainHoursBlockHours = "hours_block";
const maintainHoursActionHours = "hours";

//******************** Views ********************//
const registerView = {
  trigger_id: "",
  view: {
    type: "modal",
    callback_id: registerViewName,
    title: {
      type: "plain_text",
      text: "Registrieren",
      emoji: true,
    },
    submit: {
      type: "plain_text",
      text: "Submit",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Cancel",
      emoji: true,
    },
    blocks: [
      {
        type: "input",
        block_id: registerBlockNameSelect,
        label: {
          type: "plain_text",
          text: "Deine Slack ID ist noch nicht verknüpft, bitte wähle deinen Namen aus:",
        },
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Name",
            emoji: true,
          },
          options: [], //users go here
          action_id: registerActionNameSelect,
        },
      },
    ],
  },
};

const maintainHoursView = {
  trigger_id: "",
  view: {
    type: "modal",
    callback_id: maintainHoursViewName,
    title: {
      type: "plain_text",
      text: "Arbeitsstunden erfassen",
      emoji: true,
    },
    submit: {
      type: "plain_text",
      text: "Submit",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Cancel",
      emoji: true,
    },
    blocks: [
      {
        type: "input",
        block_id: maintainHoursBlockDescription,
        element: {
          type: "plain_text_input",
          action_id: maintainHoursActionDescription,
        },
        label: {
          type: "plain_text",
          text: "Kurzbeschreibung",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: maintainHoursBlockDate,
        element: {
          type: "datepicker",
          placeholder: {
            type: "plain_text",
            text: "Datum auswählen",
            emoji: true,
          },
          action_id: maintainHoursActionDate,
        },
        label: {
          type: "plain_text",
          text: "Datum des Arbeitseinsatzes",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: maintainHoursBlockHours,
        element: {
          type: "plain_text_input",
          action_id: maintainHoursActionHours,
          initial_value: "0,5",
        },
        label: {
          type: "plain_text",
          text: "Stunden",
          emoji: true,
        },
      },
    ],
  },
};

const basicConfirmDialogView = {
  channel: "",
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
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Approve",
            emoji: true,
          },
          style: "primary",
          value: "", //set in method
          action_id: "", //set in method
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Reject",
            emoji: true,
          },
          style: "danger",
          value: "", //set in method
          action_id: "", //set in method
        },
      ],
    },
  ],
};

const newUserJoinedMessage = {
  channel: "",
  text: "", //set in method
  blocks: [
    {
      type: "input",
      element: {
        type: "external_select",
        placeholder: {
          type: "plain_text",
          text: "Name auswählen",
          emoji: true,
        },
        action_id: "user_options",
        min_query_length: 0,
      },
      label: {
        type: "plain_text",
        text: "", // set in method
        emoji: true,
      },
    },
  ],
};

//******************** Functions ********************//
async function getRegisterView(triggerId) {
  let view = JSON.parse(JSON.stringify(registerView));
  view.trigger_id = triggerId;

  //set users
  let users = await sheet.getAllUsers();

  for (let user of users) {
    view.view.blocks[0].element.options.push({
      text: {
        type: "plain_text",
        text: user.name,
        emoji: true,
      },
      value: user.id,
    });
  }

  return view;
}

async function getAutoRegisterMessage(slackId) {
  let view = JSON.parse(JSON.stringify(basicConfirmDialogView));
  view.channel = await sheet.getAdminChannel();

  view.text =
    view.blocks[0].text.text = `<@${slackId}> ist beigetreten und noch nicht registriert. Bitte wähle den Namen aus:`;

  view.blocks[1].elements[0].value = slackId;
  view.blocks[1].elements[0].text.text = "Submit";
  view.blocks[1].elements[0].action_id = "auto-register-submit-button";
  view.blocks[1].block_id = autoregisterInputBlock;

  //add user select
  let users = await sheet.getAllUsers();

  view.blocks[1].elements.unshift({
    type: "static_select",
    placeholder: {
      type: "plain_text",
      text: "Name",
      emoji: true,
    },
    options: [], //users go here
    action_id: registerActionNameSelect,
  });

  for (let user of users) {
    view.blocks[1].elements[0].options.push({
      text: {
        type: "plain_text",
        text: user.name,
        emoji: true,
      },
      value: user.id,
    });
  }

  //remove decline button
  view.blocks[1].elements.pop();

  return view;
}

async function getRegisterConfirmDialog(registerObj) {
  //{ id, slackId, name, approved }
  let view = JSON.parse(JSON.stringify(basicConfirmDialogView));
  view.channel = await sheet.getAdminChannel();

  view.text =
    view.blocks[0].text.text = `<@${registerObj.slackId}> möchte sich als ${registerObj.name} registrieren`;

  view.blocks[1].elements[0].value = JSON.stringify(registerObj);
  view.blocks[1].elements[0].action_id = "register-approve-button";
  view.blocks[1].elements[1].value = JSON.stringify(registerObj);
  view.blocks[1].elements[1].action_id = "register-reject-button";

  return view;
}

function getUserRegisterStartMessage({ slackId, name }) {
  let view = JSON.parse(JSON.stringify(views.basicMessage));
  view.channel = slackId;

  view.text = `Deine Registrierung als ${name} wurde zur Freigabe weitergeleitet.\nDu wirst informiert, sobald die Verlinkung freigegeben wurde.`;

  return view;
}

function getUserRegisterEndMessage({ slackId, name, approved }) {
  let view = JSON.parse(JSON.stringify(views.basicMessage));
  view.channel = slackId;

  view.text = `Deine Registrierung als ${name} wurde ${
    approved
      ? "genehmigt. Du kannst jetzt deine Arbeitsstunden erfassen und abrufen."
      : "abgelehnt."
  }`;

  return view;
}

function getMaintainHoursView(triggerId) {
  let view = JSON.parse(JSON.stringify(maintainHoursView));
  view.trigger_id = triggerId;

  return view;
}

async function getMaintainConfirmDialog(entity) {
  //{ slackId, title, hours, date }
  let view = JSON.parse(JSON.stringify(basicConfirmDialogView));
  let dateObj = new Date(
    entity.date.split("-")[0],
    entity.date.split("-")[1] - 1,
    entity.date.split("-")[2]
  );

  view.channel = await sheet.getAdminChannel();
  view.text = view.blocks[0].text.text = `<@${
    entity.slackId
  }> möchte folgenden Arbeitseinsatz erfassen:\n${entity.title}: ${
    entity.hours
  } Stunde${entity.hours == 1 ? "" : "n"} am ${util.formatDate(dateObj)}`;

  view.blocks[1].elements[0].value = JSON.stringify(entity);
  view.blocks[1].elements[0].action_id = "maintain-approve-button";
  view.blocks[1].elements[1].value = JSON.stringify(entity);
  view.blocks[1].elements[1].action_id = "maintain-reject-button";

  return view;
}

function getUserMaintainStartMessage({ slackId, title, hours, date }) {
  let view = JSON.parse(JSON.stringify(views.basicMessage));
  let dateObj = new Date(
    date.split("-")[0],
    date.split("-")[1] - 1,
    date.split("-")[2]
  );

  view.channel = slackId;
  view.text = `Deine Erfassung von ${hours} Stunden am ${util.formatDate(
    dateObj
  )} für "${title}" wurde zur Freigabe weitergeleitet.\nDu wirst informiert, sobald die Stunden genehmigt wurden.`;

  return view;
}

function getUserMaintainEndMessage({ slackId, title, hours, date, approved }) {
  let view = JSON.parse(JSON.stringify(views.basicMessage));
  let dateObj = new Date(
    date.split("-")[0],
    date.split("-")[1] - 1,
    date.split("-")[2]
  );

  view.channel = slackId;
  view.text = `Deine Erfassung von ${hours} Stunden am ${util.formatDate(
    dateObj
  )} für "${title}" wurde ${approved ? "genehmigt" : "abgelehnt"}.`;

  return view;
}

async function getNewUserJoinedMessage({ slackId }) {
  let view = newUserJoinedMessage;

  view.channel = "GPPHHTLSU"; //= await sheet.getAdminChannel();
  view.text =
    view.blocks[0].label.text = `Nutzer <@${slackId}> ist neu in Slack. Mit welchem Namen soll er verknüpft werden?`;

  //todo: Buttons mit slackID

  return view;
}

//exports
module.exports = {
  getNewUserJoinedMessage,

  getRegisterView,
  getRegisterConfirmDialog,
  getUserRegisterStartMessage,
  getUserRegisterEndMessage,
  getAutoRegisterMessage,
  registerViewName,
  registerBlockNameSelect,
  registerActionNameSelect,
  autoregisterInputBlock,

  getMaintainHoursView,
  getMaintainConfirmDialog,
  getUserMaintainStartMessage,
  getUserMaintainEndMessage,
  maintainHoursViewName,
  maintainHoursBlockDescription,
  maintainHoursActionDescription,
  maintainHoursBlockDate,
  maintainHoursActionDate,
  maintainHoursBlockHours,
  maintainHoursActionHours,
};
