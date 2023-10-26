import ListItem from "../component/ListItem.js";
import ListHeader from "../component/ListHeader.js";
import { push } from "../../util/router.js";
import { request } from "../../util/api.js";

export default function ListPage({ $target, initialState }) {
  const $docList = document.createElement("div");
  $docList.classList = "sidebar-list";
  this.state = initialState;
  /**
   * state ; {documentsTree, isLoading}
   */
  let isInitialize = true;

  const $newDocButton = document.createElement("div");
  $newDocButton.classList = "new-folder";
  $newDocButton.textContent = "새로운 폴더 생성";

  const listHeader = new ListHeader({
    $target,
    initialState: this.state.isLoading,
  });

  $target.appendChild($newDocButton);
  $target.appendChild($docList);

  //초기값은 어차피 중요하지 않았음 렌더링할때 화면 비어있고 Initialize로 그림그리기때문에
  const listItem = new ListItem({
    $target: $docList,
    initialState: this.state.documentsTree,
  });

  //상태 업데이트 및 컴포넌트 리렌더링
  this.setState = (nextState) => {
    //nextState = documentsTree, isLoading
    this.state = nextState;
    listHeader.setState(this.state.isLoading);
    this.render();
    listItem.setState(this.state.documentsTree);
  };

  this.render = () => {
    $docList.innerHTML = ``;
  };

  // fetch요청 후 상태 업데이트
  this.fetchDocumentsList = async () => {
    this.setState({ documentsTree: this.state.documentsTree, isLoading: true });
    const documents = await request("/documents");
    this.setState({ documentsTree: documents, isLoading: false });
  };

  const init = () => {
    if (isInitialize) {
      this.fetchDocumentsList();
      isInitialize = false;
    }
  };

  init();

  // 새로운 디렉토리 생성하는 버튼 => parents : root

  $newDocButton.addEventListener("click", async () => {
    const req = await request("/documents", {
      method: "POST",
      body: JSON.stringify({ parent: null, title: "새로 생성된 파일" }),
    });
    await this.fetchDocumentsList();
    push(`/documents/${req.id}`);
  });

  //각 li별 추가-삭제 div 마우스 hover이벤트

  $docList.addEventListener("mouseover", (e) => {
    const $li = e.target.closest("li");
    if ($li) {
      const $removeButton = $li.querySelector(".remove-folder");
      const $addButton = $li.querySelector(".add-folder");

      $removeButton.style.display = "inline";
      $addButton.style.display = "inline";
    }
  });

  $docList.addEventListener("mouseout", (e) => {
    const $li = e.target.closest("li");
    if ($li) {
      const $removeButton = $li.querySelector(".remove-folder");
      const $addButton = $li.querySelector(".add-folder");

      $removeButton.style.display = "none";
      $addButton.style.display = "none";
    }
  });

  // li 내 이벤트 버블링
  $docList.addEventListener("click", async (e) => {
    const $li = e.target.closest("li");

    if ($li) {
      const { id } = $li.dataset;
      const $div = $li.querySelector(".div-ul-li-container");
      const $toggleButton = $li.querySelector(".toggle-folder");
      const $span = $li.querySelector(".non-documents");

      if (e.target.classList.contains("toggle-folder")) {
        if ($div) {
          $div.style.display = $div.style.display === "none" ? "block" : "none";
        } else {
          $span.style.display =
            $span.style.display === "none" ? "block" : "none";
        }
        $toggleButton.innerHTML = $toggleButton.innerHTML === "˅" ? "˃" : "˅";
      }

      //기존 파일 삭제 => Documents 리렌더링
      else if (e.target.classList.contains("remove-folder")) {
        await request(`/documents/${id}`, {
          method: "DELETE",
        });
        await this.fetchDocumentsList();
        push(`/`);
      }

      //새로운 파일 추가 => Documents 리렌더링
      else if (e.target.classList.contains("add-folder")) {
        const req = await request("/documents", {
          method: "POST",
          body: JSON.stringify({ parent: id, title: "새로 생성된 파일" }),
        });
        await this.fetchDocumentsList();
        push(`/documents/${req.id}`);
      }

      // 본인을 제외한 다른 파일을 클릭했을 때 해당에디터 열기
      else if (
        e.target.classList.contains("click-folder") &&
        id !== window.location.pathname.split("/").pop()
      ) {
        push(`/documents/${id}`);
      }
    }
  });
}
