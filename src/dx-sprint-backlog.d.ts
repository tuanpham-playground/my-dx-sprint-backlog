declare namespace kintone.types {
  interface Backlog {
    id?: number;
    value: {
      pbi_title: kintone.fieldTypes.SingleLineText;
      pbi_link: kintone.fieldTypes.Link;
      issue: kintone.fieldTypes.Number;
      repo: kintone.fieldTypes.DropDown;
      pbi_status: kintone.fieldTypes.DropDown;
      pbi_storypoint: kintone.fieldTypes.Number;
      pbi_acheived_storypoint: kintone.fieldTypes.Calc;
    };
  }
  interface SprintBacklog {
    Table: {
      type: "SUBTABLE";
      value: Backlog[];
    };
  }
  interface SavedSprintBacklog extends SprintBacklog {
    $id: kintone.fieldTypes.Id;
    $revision: kintone.fieldTypes.Revision;
    Created_by: kintone.fieldTypes.Creator;
    Updated_by: kintone.fieldTypes.Modifier;
    Updated_datetime: kintone.fieldTypes.UpdatedTime;
    Created_datetime: kintone.fieldTypes.CreatedTime;
    Record_number: kintone.fieldTypes.RecordNumber;
  }
}
