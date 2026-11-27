'use strict';
(() => {
  const main = document.getElementById('asignaturas');
  const element = (tag, cls, text) => { const e=document.createElement(tag); if(cls)e.className=cls; if(text!==undefined)e.textContent=text; return e; };
  // Reproductor único en ventana modal: conserva todas las miniaturas.
  const dialog=element('dialog','video-dialog');dialog.setAttribute('aria-labelledby','video-dialog-title');
  const dialogHeader=element('header','video-dialog-header');
  const dialogTitle=element('h2');dialogTitle.id='video-dialog-title';
  const closeButton=element('button','video-close','Cerrar ×');closeButton.type='button';closeButton.setAttribute('aria-label','Cerrar video');
  const screen=element('div','video-screen');
  const dialogFooter=element('div','video-dialog-footer');
  const driveLink=element('a','video-drive-link','Abrir video en Google Drive');driveLink.target='_blank';driveLink.rel='noopener noreferrer';
  dialogHeader.append(dialogTitle,closeButton);dialogFooter.append(driveLink);dialog.append(dialogHeader,screen,dialogFooter);document.body.append(dialog);
  let active=null;
  function stopVideo(){if(dialog.open)dialog.close();}
  dialog.addEventListener('close',()=>{if(dialog.open)return;screen.replaceChildren();driveLink.removeAttribute('href');document.body.classList.remove('video-open');const trigger=active?.button;active=null;if(trigger?.isConnected)trigger.focus({preventScroll:true});});
  closeButton.addEventListener('click',stopVideo);
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)stopVideo();});
  function openVideo(project,button,article){
    if(dialog.open)return;
    dialogTitle.textContent=project.nombre;
    driveLink.href=`https://drive.google.com/file/d/${project.driveId}/view`;
    const iframe=element('iframe');iframe.src=`https://drive.google.com/file/d/${project.driveId}/preview`;iframe.title=`Video de ${project.nombre}`;iframe.allow='autoplay; fullscreen';iframe.allowFullscreen=true;
    screen.replaceChildren(iframe);active={button,article};dialog.showModal();document.body.classList.add('video-open');closeButton.focus();
  }
  function card(project, showDescription = true){
    const article=element('article',showDescription?'project':'project no-description');
    const media=element('div','media');
    const header=element('header','project-header');
    const authors=element('footer','project-authors');
    const body=element('div','project-body');
    const cover=element('div','project-cover');
    const button=element('button','play');button.type='button';button.setAttribute('aria-label',`Reproducir ${project.nombre}`);
    const icon=element('span','play-icon');icon.setAttribute('aria-hidden','true');
    if(project.miniatura){
      const image=element('img','video-thumbnail');image.src=project.miniatura;image.alt='';image.loading='lazy';image.decoding='async';
      button.classList.add('has-thumbnail');button.append(image);
      image.addEventListener('error',()=>{button.classList.remove('has-thumbnail');image.remove();},{once:true});
    }
    button.append(icon,element('span','play-label','Reproducir video'));
    media.append(button);
    const title=element('h3','',project.nombre);
    const students=Array.isArray(project.estudiantes)?project.estudiantes.filter(x=>typeof x==='string'&&x.trim()):[];
    const student=element('ul',students.length?'student':'student pending');for(const name of (students.length?students:['Nombre pendiente de confirmar']))student.append(element('li','',name));
    const valid=/^[A-Za-z0-9_-]{10,}$/.test(project.driveId||'');
    if(valid){button.setAttribute('aria-haspopup','dialog');button.addEventListener('click',()=>openVideo(project,button,article));}
    else{button.disabled=true;button.querySelector('.play-label').textContent='Video no disponible';}
    header.append(title);authors.append(student);cover.append(media);article.append(cover,header);
    if(showDescription){body.append(element('p','description',project.descripcion||'Descripción pendiente de incorporar.'));article.append(body);}
    article.append(authors);return article;
  }
  // Synchronize each text band across all cards in a course, not only within one row.
  // Measure natural content (grid items align to start), including padding and borders.
  const grids=[];
  let scheduled=false;
  function alignCards(){
    scheduled=false;
    for(const grid of grids){
      if(!grid.getClientRects().length || grid.clientWidth===0)continue;
      for(const [selector,prop] of [['.project-header','--title-height'],['.project-authors','--authors-height'],['.project-body','--body-height']]){
        const height=Math.ceil(Math.max(0,...Array.from(grid.querySelectorAll(selector),x=>x.getBoundingClientRect().height)));
        grid.style.setProperty(prop,`${height}px`);
      }
    }
  }
  function scheduleAlignment(){if(!scheduled){scheduled=true;requestAnimationFrame(alignCards);}}
  const widths=new WeakMap();
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{
    for(const entry of entries){const width=entry.contentRect.width;if(widths.get(entry.target)!==width){widths.set(entry.target,width);scheduleAlignment();}}
  }):null;
  for(const subject of window.PROYECTOS||[]){
    const details=element('details','course');details.open=true;
    const summary=element('summary');const heading=element('div','course-heading');
    const projects=Array.isArray(subject.proyectos)?subject.proyectos:[];
    heading.append(element('h2','',subject.nombre));
    if(subject.enfoque)heading.append(element('p','course-focus',subject.enfoque));
    heading.append(element('span','count',[subject.semestre,`${projects.length} ${projects.length===1?'proyecto':'proyectos'}`].filter(Boolean).join(' · ')));
    const chevron=element('span','chevron');chevron.setAttribute('aria-hidden','true');summary.append(heading,chevron);
    const body=element('div','course-body');
    if(projects.length){const grid=element('div','projects');for(const p of projects)grid.append(card(p,!subject.sinDescripcion));body.append(grid);grids.push(grid);observer?.observe(grid);}else{body.append(element('p','empty','Aún no hay proyectos disponibles.'));}
    details.append(summary,body);details.addEventListener('toggle',()=>{if(!details.open&&active&&details.contains(active.article))stopVideo();if(details.open)scheduleAlignment();});main.append(details);
  }
  scheduleAlignment();window.addEventListener('resize',scheduleAlignment);document.fonts?.ready.then(scheduleAlignment);
})();
